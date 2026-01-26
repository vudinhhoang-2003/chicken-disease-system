import json
import logging
from typing import List, Optional, Dict
from pathlib import Path

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import SystemMessage, HumanMessage

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

from sqlalchemy.orm import Session, joinedload

from app.core import models

from app.core.database import SessionLocal



class RAGService:

    """Service for Retrieval Augmented Generation using Google Gemini"""

    

    def __init__(self):

        self.settings = get_settings()

        

        # Initialize Gemini

        if self.settings.google_api_key:

            self.llm = ChatGoogleGenerativeAI(

                model="gemini-1.5-flash",

                google_api_key=self.settings.google_api_key,

                temperature=0.2

            )

        else:

            logger.warning("⚠️ GOOGLE_API_KEY not found. RAG Service will not work.")

            self.llm = None



    def _get_knowledge_from_db(self) -> str:

        """Fetch knowledge from Database and format as text"""

        db = SessionLocal()

        try:

            diseases = db.query(models.Disease).options(

                joinedload(models.Disease.treatment_steps)

                .joinedload(models.TreatmentStep.medicines)

            ).all()

            

            context = "Dưới đây là kiến thức chuẩn về các bệnh thường gặp ở gà:\n\n"

            

            for d in diseases:

                context += f"BỆNH: {d.name_vi} ({d.name_en})\n"

                context += f"- Triệu chứng: {d.symptoms}\n"

                context += f"- Nguyên nhân: {d.cause}\n"

                context += f"- Phòng bệnh: {d.prevention}\n"

                context += "PHÁC ĐỒ ĐIỀU TRỊ:\n"

                

                # Sort steps by order

                steps = sorted(d.treatment_steps, key=lambda x: x.step_order)

                for step in steps:

                    context += f"  Bước {step.step_order}: {step.description}\n"

                    if step.action:

                        context += f"    -> Hành động: {step.action}\n"

                    

                    for med in step.medicines:

                        context += f"    -> Thuốc: {med.name}"

                        if med.active_ingredient:

                            context += f" ({med.active_ingredient})"

                        context += f". Liều dùng: {med.dosage}\n"

                context += "---\n"

                

            return context

        except Exception as e:

            logger.error(f"Error fetching knowledge from DB: {e}")

            return ""

        finally:

            db.close()



    async def answer_question(self, question: str, history: List[Dict] = []) -> str:

        """Answer a question using Gemini and the knowledge base"""

        if not self.llm:

            return "Xin lỗi, hệ thống Chatbot hiện chưa được cấu hình API Key. Vui lòng liên hệ quản trị viên."



        try:

            # Fetch fresh context from DB for every request (or cache it)

            context = self._get_knowledge_from_db()

            

            system_prompt = f"""

            Bạn là một chuyên gia thú y chuyên về các loại bệnh ở gà. 

            Sử dụng thông tin dưới đây để trả lời câu hỏi của người chăn nuôi một cách chuyên nghiệp, tận tâm và dễ hiểu.

            

            {context}




            
            LƯU Ý:
            1. Nếu câu hỏi không liên quan đến bệnh gà hoặc kiến thức thú y, hãy lịch sự từ chối.
            2. Nếu thông tin không có trong kiến thức được cung cấp, hãy dựa vào kiến thức chuyên môn của bạn nhưng phải ghi chú rõ đó là thông tin bổ sung.
            3. Luôn khuyên người chăn nuôi quan sát kỹ đàn gà và liên hệ thú y địa phương nếu tình hình nghiêm trọng.
            4. Trả lời bằng tiếng Việt.
            """
            
            messages = [SystemMessage(content=system_prompt)]
            
            # Add history
            for msg in history[-5:]: # Keep last 5 messages
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(SystemMessage(content=msg["content"]))
            
            messages.append(HumanMessage(content=question))
            
            response = await self.llm.ainvoke(messages)
            return response.content
            
        except Exception as e:
            logger.error(f"❌ Error in RAG Service: {e}")
            return f"Đã xảy ra lỗi khi xử lý câu hỏi: {str(e)}"

# Singleton
_rag_service: Optional[RAGService] = None

def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
