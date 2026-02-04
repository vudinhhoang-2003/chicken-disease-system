from fastapi import APIRouter, Depends, HTTPException
from typing import Any

from app.services.rag_service import get_rag_service, RAGService
from app.schema.chat import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
async def ask_veterinary_expert(
    request: ChatRequest,
    rag_service: RAGService = Depends(get_rag_service)
) -> Any:
    """
    Ask a question to the AI Veterinary Expert
    """
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    result = await rag_service.answer_question(
        question=request.message,
        history=request.history
    )
    
    return ChatResponse(
        answer=result["answer"],
        sources=["Hệ thống kiến thức chuyên gia về bệnh gà"],
        usage=result["usage"]
    )
