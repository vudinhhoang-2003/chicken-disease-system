from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.models import DiagnosisLog, DetectionLog, User
from app.api.deps import get_current_active_superuser

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy số liệu thống kê tổng quan cho Dashboard"""
    
    # Đếm tổng số bản ghi chẩn đoán
    total_diagnosis = db.query(DiagnosisLog).count()
    total_detections = db.query(DetectionLog).count()
    
    # Đếm số ca có bệnh (ví dụ: disease != 'Healthy')
    sick_cases = db.query(DiagnosisLog).filter(DiagnosisLog.predicted_disease != 'Healthy').count()
    
    return {
        "total_diagnosis": total_diagnosis + total_detections,
        "sick_cases": sick_cases,
        "total_detections": total_detections,
        "total_fecal_analysis": total_diagnosis
    }

@router.get("/recent-logs")
async def get_recent_logs(
    db: Session = Depends(get_db), 
    limit: int = 10,
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy danh sách các chẩn đoán mới nhất"""
    logs = db.query(DiagnosisLog).order_by(DiagnosisLog.created_at.desc()).limit(limit).all()
    return logs
