import logging
from typing import List, Optional, Dict
import chromadb
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import SystemMessage, HumanMessage
from sqlalchemy.orm import joinedload

from app.config import get_settings
from app.core import models
from app.core.database import SessionLocal
from app.services.usage_service import usage_service

from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)
settings = get_settings()

from langchain_community.callbacks import get_openai_callback

class RAGService:
    """Service for RAG using Local HuggingFace Embeddings and Dynamic LLM Provider"""

    def __init__(self):
        self.settings = get_settings()
        self.llm = None
        self.custom_system_prompt = None
        self._initialize_llm()
        
        # 2. Initialize LOCAL Embeddings (HuggingFace)
        try:
            logger.info("📡 Loading Local Embedding Model (paraphrase-multilingual-MiniLM-L12-v2)...")
            self.embeddings = HuggingFaceEmbeddings(
                model_name="paraphrase-multilingual-MiniLM-L12-v2"
            )
            logger.info("✅ Local Embedding Model loaded.")
        except Exception as e:
            logger.error(f"❌ Failed to load Embedding model: {e}")
            self.embeddings = None

        # 3. Initialize ChromaDB Client
        try:
            self.chroma_client = chromadb.HttpClient(
                host=self.settings.chroma_host,
                port=self.settings.chroma_port,
                settings=chromadb.Settings(
                    allow_reset=True,
                    anonymized_telemetry=False
                )
            )
            self.chroma_client.heartbeat()
            self.collection = self.chroma_client.get_or_create_collection(name="chicken_knowledge")
            logger.info("✅ Connected to ChromaDB")
        except Exception as e:
            logger.error(f"❌ Failed to connect to ChromaDB: {e}")
            self.chroma_client = None

        # 4. Initialize Text Splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=700,
            chunk_overlap=150,
            separators=["\n\n", "\n", ".", "!", "?", " ", ""]
        )

    def _initialize_llm(self):
        """Initialize LLM with dynamic settings from Database"""
        db = SessionLocal()
        try:
            # Lấy toàn bộ settings liên quan đến AI
            all_settings = db.query(models.Setting).filter(models.Setting.key.like("ai_%")).all()
            settings_dict = {s.key: s.value for s in all_settings}
            
            provider = settings_dict.get("ai_provider", "groq")
            model_name = settings_dict.get("ai_model", self.settings.llm_model)
            temperature = float(settings_dict.get("ai_temperature", 0.2))
            
            if provider == "groq":
                api_key = settings_dict.get("ai_groq_key", self.settings.groq_api_key)
                if api_key:
                    self.llm = ChatGroq(groq_api_key=api_key, model_name=model_name, temperature=temperature)
                    logger.info(f"✅ AI Initialized: Groq ({model_name})")
                else:
                    self.llm = None
            elif provider == "gemini":
                api_key = settings_dict.get("ai_gemini_key", self.settings.google_api_key)
                if api_key:
                    self.llm = ChatGoogleGenerativeAI(google_api_key=api_key, model=model_name, temperature=temperature)
                    logger.info(f"✅ AI Initialized: Gemini ({model_name})")
                else:
                    self.llm = None
            
            self.custom_system_prompt = settings_dict.get("ai_system_prompt", None)

        except Exception as e:
            logger.error(f"❌ LLM Dynamic Init Error: {e}")
            self.llm = None
        finally:
            db.close()

    def _format_disease_text(self, disease: models.Disease) -> str:
        text = f"BỆNH: {disease.name_vi} ({disease.name_en})\n"
        text += f"MÃ BỆNH: {disease.code}\n\n"
        text += f"TRIỆU CHỨNG:\n{disease.symptoms}\n\n"
        text += f"NGUYÊN NHÂN:\n{disease.cause}\n\n"
        text += f"PHÒNG BỆNH:\n{disease.prevention}\n\n"
        
        if disease.treatment_steps:
            text += "PHÁC ĐỒ ĐIỀU TRỊ:\n"
            steps = sorted(disease.treatment_steps, key=lambda x: x.step_order)
            for step in steps:
                text += f"- Bước {step.step_order}: {step.description}\n"
                if step.action:
                    text += f"  -> Hành động: {step.action}\n"
                for med in step.medicines:
                    text += f"  -> Thuốc: {med.name} (Liều: {med.dosage})\n"
        return text

    def sync_disease(self, disease_id: int):
        db = SessionLocal()
        disease = None
        try:
            disease = db.query(models.Disease).filter(models.Disease.id == disease_id).first()
            if not disease: return
            if not self.chroma_client or not self.embeddings: raise Exception("Vector DB not ready")

            disease_full = db.query(models.Disease).options(
                joinedload(models.Disease.treatment_steps).joinedload(models.TreatmentStep.medicines)
            ).filter(models.Disease.id == disease_id).first()

            text_content = self._format_disease_text(disease_full)
            chunks = self.text_splitter.split_text(text_content)
            
            ids = []
            documents = []
            metadatas = []
            
            for i, chunk in enumerate(chunks):
                ids.append(f"dis_{disease.id}_chunk_{i}")
                documents.append(chunk)
                metadatas.append({
                    "id": disease.id, 
                    "type": "disease", 
                    "code": disease.code, 
                    "name": disease.name_vi,
                    "source": disease.source if disease.source else "Chưa phân loại",
                    "chunk_index": i
                })
                
            embeddings = self.embeddings.embed_documents(documents)
            
            self.collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            disease.sync_status = "SUCCESS"; disease.sync_error = None
            db.commit()
        except Exception as e:
            if disease:
                disease.sync_status = "ERROR"; disease.sync_error = str(e)
                db.commit()
        finally: db.close()

    def delete_disease_vector(self, disease_id: int):
        if self.collection:
            try:
                self.collection.delete(where={"$and": [{"id": disease_id}, {"type": "disease"}]})
            except Exception as e: 
                logger.error(f"❌ Error deleting disease vectors: {e}")

    def _format_general_knowledge_text(self, knowledge: models.GeneralKnowledge) -> str:
        text = f"KIẾN THỨC CHĂN NUÔI: {knowledge.category}\nCHỦ ĐỀ: {knowledge.title}\n"
        text += f"NỘI DUNG:\n{knowledge.content}"
        return text

    def sync_general_knowledge(self, knowledge_id: int):
        db = SessionLocal()
        knowledge = None
        try:
            knowledge = db.query(models.GeneralKnowledge).filter(models.GeneralKnowledge.id == knowledge_id).first()
            if not knowledge or not self.chroma_client or not self.embeddings: return
            text_content = self._format_general_knowledge_text(knowledge)
            chunks = self.text_splitter.split_text(text_content)
            
            ids = []
            documents = []
            metadatas = []
            
            for i, chunk in enumerate(chunks):
                ids.append(f"gen_{knowledge.id}_chunk_{i}")
                documents.append(chunk)
                metadatas.append({
                    "id": knowledge.id, 
                    "type": "general", 
                    "title": knowledge.title,
                    "source": knowledge.source if knowledge.source else "Chưa phân loại",
                    "chunk_index": i
                })
                
            embeddings = self.embeddings.embed_documents(documents)
            
            self.collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            knowledge.sync_status = "SUCCESS"; knowledge.sync_error = None
            db.commit()
        except Exception as e:
            if knowledge:
                knowledge.sync_status = "ERROR"; knowledge.sync_error = str(e)
                db.commit()
        finally: db.close()

    def delete_general_knowledge_vector(self, knowledge_id: int):
        if self.collection:
            try: 
                self.collection.delete(where={"$and": [{"id": knowledge_id}, {"type": "general"}]})
            except Exception as e: 
                logger.error(f"❌ Error deleting general knowledge vectors: {e}")

    async def answer_question(self, question: str, history: List[Dict] = []) -> Dict:
        if not self.chroma_client or not self.embeddings: 
            return {"answer": "Hệ thống AI chưa sẵn sàng.", "usage": None}
        try:
            query_vector = self.embeddings.embed_query(question)
            # Tăng n_results lên 5 vì chunk_size đã thu nhỏ lại khoảng 700 ký tự (~256 tokens)
            results = self.collection.query(query_embeddings=[query_vector], n_results=5)
            context = ""
            if results['documents'] and results['documents'][0]:
                # Sử dụng trực tiếp chunk thay vì substring cắt dở dang
                # Lấy kèm Metadata Source đính lên đầu (Header) của từng Chunk
                formatted_chunks = []
                for idx, doc in enumerate(results['documents'][0]):
                    meta = results['metadatas'][0][idx] if results['metadatas'] else {}
                    source_text = meta.get('source', 'Chưa phân loại')
                    formatted_chunks.append(f"[Nguồn tham khảo: {source_text}]\n{doc}")
                
                context = "THÔNG TIN CHUYÊN MÔN TÌM THẤY:\n\n" + "\n---\n".join(formatted_chunks)
            
            if not self.llm:
                return {
                    "answer": f"Tôi tìm thấy thông tin sau:\n\n{context}" if context else "Chưa có dữ liệu.",
                    "usage": None
                }

            # SỬ DỤNG HOÀN TOÀN TỪ WEB ADMIN (Dọn dẹp code)
            if self.custom_system_prompt:
                base_prompt = self.custom_system_prompt
            else:
                # Fallback tối giản nhất nếu admin chưa kịp nhập trên Web
                base_prompt = "{context}\n\nTrả lời dựa trên dữ liệu trên."
            
            # CHÈN KIẾN THỨC VÀO PROMPT
            final_system_prompt = base_prompt.replace("{context}", context)
            
            messages = [SystemMessage(content=final_system_prompt)]
            for msg in history[-5:]:
                messages.append(HumanMessage(content=msg["content"]) if msg["role"] == "user" else SystemMessage(content=msg["content"]))
            messages.append(HumanMessage(content=question))
            
            # Sử dụng callback để lấy token usage
            with get_openai_callback() as cb:
                response = await self.llm.ainvoke(messages)
                
                usage_data = {
                    "prompt_tokens": cb.prompt_tokens,
                    "completion_tokens": cb.completion_tokens,
                    "total_tokens": cb.total_tokens
                }
                
                logger.info(f"📊 Token Usage từ Callback: {usage_data}")

            # Ghi Log sử dụng vào DB
            try:
                usage_service.log_usage(
                    feature="chat",
                    provider="groq" if "groq" in str(type(self.llm)).lower() else "gemini",
                    model=getattr(self.llm, 'model_name', getattr(self.llm, 'model', 'unknown')),
                    tokens_prompt=usage_data["prompt_tokens"],
                    tokens_completion=usage_data["completion_tokens"]
                )
            except Exception as log_err:
                logger.error(f"Usage Logging Error: {log_err}")

            return {
                "answer": response.content,
                "usage": usage_data
            }
        except Exception as e:
            logger.error(f"❌ RAG Error: {e}")
            return {"answer": "Đã xảy ra lỗi khi xử lý câu hỏi.", "usage": None}

_rag_service: Optional[RAGService] = None
def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None: _rag_service = RAGService()
    return _rag_service
