import logging
from typing import List, Optional, Dict
import chromadb
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import SystemMessage, HumanMessage
from sqlalchemy.orm import joinedload

from app.config import get_settings
from app.core import models
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)
settings = get_settings()

class RAGService:
    """Service for RAG using Local HuggingFace Embeddings and Google Gemini LLM"""

    def __init__(self):
        self.settings = get_settings()
        
        # 1. Initialize Gemini LLM (Optional fallback)
        if self.settings.google_api_key:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=self.settings.google_api_key,
                temperature=0.2
            )
        else:
            logger.warning("⚠️ GOOGLE_API_KEY not found. LLM will not be available.")
            self.llm = None

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
            # Ensure heartbeat to check connection
            self.chroma_client.heartbeat()
            self.collection = self.chroma_client.get_or_create_collection(name="chicken_knowledge")
            logger.info("✅ Connected to ChromaDB")
        except Exception as e:
            logger.error(f"❌ Failed to connect to ChromaDB: {e}")
            self.chroma_client = None

    def _format_disease_text(self, disease: models.Disease) -> str:
        """Helper to format disease info into a structured document"""
        text = f"BỆNH: {disease.name_vi} ({disease.name_en})\n"
        if disease.source:
            text += f"NGUỒN TÀI LIỆU: {disease.source}\n"
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
        """Sync a disease from SQL to Vector DB using Local Embeddings"""
        if not self.chroma_client or not self.embeddings:
            logger.error("ChromaDB or Embeddings not initialized")
            return

        db = SessionLocal()
        try:
            disease = db.query(models.Disease).options(
                joinedload(models.Disease.treatment_steps).joinedload(models.TreatmentStep.medicines)
            ).filter(models.Disease.id == disease_id).first()
            
            if not disease:
                return

            text_content = self._format_disease_text(disease)
            
            # Using langchain embeddings to generate vector
            vector = self.embeddings.embed_query(text_content)
            
            # Upsert into ChromaDB
            self.collection.upsert(
                ids=[str(disease.id)],
                embeddings=[vector],
                documents=[text_content],
                metadatas=[{
                    "id": disease.id,
                    "code": disease.code,
                    "name": disease.name_vi,
                    "source": disease.source or "Chưa rõ"
                }]
            )
            logger.info(f"✨ Synced {disease.name_vi} to Vector DB (Local)")
        except Exception as e:
            logger.error(f"❌ Sync error: {e}")
        finally:
            db.close()

    def delete_disease_vector(self, disease_id: int):
        """Remove a disease from Vector DB"""
        if self.collection:
            try:
                self.collection.delete(ids=[str(disease_id)])
                logger.info(f"🗑️ Deleted disease ID {disease_id} from Vector DB")
            except Exception as e:
                logger.error(f"❌ Delete vector error: {e}")

    async def answer_question(self, question: str, history: List[Dict] = []) -> str:
        """Answer question using Local Semantic Search + Gemini (if available)"""
        if not self.chroma_client or not self.embeddings:
            return "Xin lỗi, hệ thống AI hiện chưa sẵn sàng."

        try:
            # 1. Search semantic context using local embeddings
            query_vector = self.embeddings.embed_query(question)
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=2
            )
            
            context = ""
            if results['documents'] and results['documents'][0]:
                context = "THÔNG TIN CHUYÊN MÔN TÌM THẤY:\n\n" + "\n---\n".join(results['documents'][0])
            
            # 2. Fallback if no Gemini Key
            if not self.llm:
                if context:
                    return f"Tôi đã tìm thấy thông tin sau cho bạn:\n\n{context}\n\n(Lưu ý: Tôi đang chạy ở chế độ tìm kiếm trực tiếp vì chưa có API Key cho Chatbot)."
                return "Xin lỗi, tôi chưa tìm thấy kiến thức nào khớp với câu hỏi của bạn."

            # 3. Use Gemini to format answer
            system_prompt = f"""
            Bạn là chuyên gia Thú y AI. Trả lời dựa trên ngữ cảnh dưới đây:
            
            {context}
            
            Nếu không có thông tin, hãy trả lời theo hiểu biết chuyên môn và nhắc người dân cẩn trọng.
            Luôn nêu NGUỒN TÀI LIỆU nếu có.
            """
            
            messages = [SystemMessage(content=system_prompt)]
            for msg in history[-5:]:
                messages.append(HumanMessage(content=msg["content"]) if msg["role"] == "user" else SystemMessage(content=msg["content"]))
            messages.append(HumanMessage(content=question))
            
            response = await self.llm.ainvoke(messages)
            return response.content
            
        except Exception as e:
            logger.error(f"❌ RAG Error: {e}")
            return "Đã xảy ra lỗi khi xử lý câu hỏi của bạn."

# Singleton
_rag_service: Optional[RAGService] = None

def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service