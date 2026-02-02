from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic.networks import EmailStr
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.api import deps
from app.core import models
from app.core.database import get_db
from app.schema.user import UserOut, UserUpdate
from app.schema.knowledge import GeneralKnowledgeOut

router = APIRouter()

# --- USER PROFILE & STATS ---

@router.get("/me", response_model=UserOut)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    return current_user

@router.put("/me", response_model=UserOut)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    current_user_data = jsonable_encoder(current_user)
    user_in_data = user_in.dict(exclude_unset=True)
    for field in current_user_data:
        if field in user_in_data:
            setattr(current_user, field, user_in_data[field])
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/stats")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
):
    diag_query = db.query(models.DiagnosisLog).filter(models.DiagnosisLog.user_id == current_user.id)
    diag_count = diag_query.count()
    diag_sick = diag_query.filter(models.DiagnosisLog.predicted_disease != 'Healthy').count()
    avg_conf = db.query(func.avg(models.DiagnosisLog.confidence)).filter(
        models.DiagnosisLog.user_id == current_user.id
    ).scalar() or 0.0
    detect_query = db.query(models.DetectionLog).filter(models.DetectionLog.user_id == current_user.id)
    detect_count = detect_query.count()
    detect_sick = detect_query.filter(models.DetectionLog.sick_count > 0).count()
    return {
        "total_scans": diag_count + detect_count,
        "sick_cases": diag_sick + detect_sick,
        "accuracy": round(avg_conf * 100, 1)
    }

@router.get("/me/history")
def get_user_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    limit: int = 50
):
    """Lấy danh sách lịch sử chẩn đoán của chính user đó kèm chi tiết bệnh"""
    diagnosis_logs = db.query(models.DiagnosisLog).filter(
        models.DiagnosisLog.user_id == current_user.id
    ).order_by(models.DiagnosisLog.created_at.desc()).limit(limit).all()
    
    formatted_logs = []
    for log in diagnosis_logs:
        disease_detail = None
        if log.predicted_disease.lower() != "healthy":
            disease_detail = db.query(models.Disease).options(
                joinedload(models.Disease.treatment_steps).joinedload(models.TreatmentStep.medicines)
            ).filter(models.Disease.name_en.ilike(log.predicted_disease)).first()

        formatted_logs.append({
            "id": log.id,
            "type": "diagnosis",
            "image_url": f"/uploads/{log.image_path}",
            "result": log.predicted_disease,
            "confidence": log.confidence,
            "created_at": log.created_at,
            "status": "Healthy" if log.predicted_disease.lower() == "healthy" else "Sick",
            "disease_detail": disease_detail
        })
        
    detection_logs = db.query(models.DetectionLog).filter(
        models.DetectionLog.user_id == current_user.id
    ).order_by(models.DetectionLog.created_at.desc()).limit(limit).all()
    
    for log in detection_logs:
        formatted_logs.append({
            "id": log.id,
            "type": "detection",
            "image_url": f"/uploads/{log.annotated_image_path}",
            "result": f"{log.sick_count} gà bệnh / {log.total_chickens} tổng",
            "confidence": 0.0,
            "created_at": log.created_at,
            "status": "Sick" if log.sick_count > 0 else "Healthy",
            "stats": {
                "total": log.total_chickens,
                "healthy": log.healthy_count,
                "sick": log.sick_count
            }
        })
    
    formatted_logs.sort(key=lambda x: x["created_at"], reverse=True)
    return formatted_logs[:limit]

# --- PUBLIC KNOWLEDGE BROWSING ---

@router.get("/knowledge", response_model=List[GeneralKnowledgeOut])
def list_knowledge(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    return db.query(models.GeneralKnowledge).order_by(models.GeneralKnowledge.id.desc()).offset(skip).limit(limit).all()

@router.get("/knowledge/{k_id}", response_model=GeneralKnowledgeOut)
def get_knowledge_detail(
    k_id: int,
    db: Session = Depends(get_db),
):
    item = db.query(models.GeneralKnowledge).filter(models.GeneralKnowledge.id == k_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    return item
