from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.core.models import DiagnosisLog, DetectionLog, User, Disease, TreatmentStep, Medicine
from app.api.deps import get_current_active_superuser
from app.schema.knowledge import DiseaseCreate, DiseaseOut, DiseaseUpdate
from app.schema.user import UserCreate, UserUpdate, UserOut
from app.core.security import get_password_hash
from app.services.rag_service import get_rag_service

router = APIRouter()
rag_service = get_rag_service()

# --- EXISTING STATS ENDPOINTS ---

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
    limit: int = 20,
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy danh sách các chẩn đoán mới nhất từ cả 2 loại: Phân và Phát hiện gà"""
    
    # Lấy log chẩn đoán bệnh qua phân
    diagnosis_logs = db.query(DiagnosisLog).order_by(DiagnosisLog.created_at.desc()).limit(limit).all()
    
    # Format lại dữ liệu để frontend dễ hiển thị
    formatted_logs = []
    for log in diagnosis_logs:
        formatted_logs.append({
            "id": log.id,
            "type": "Phân",
            "image_url": f"/uploads/{log.image_path}",
            "result": log.predicted_disease,
            "confidence": log.confidence,
            "created_at": log.created_at,
            "status": "Hoàn thành" if log.verified_result is None else "Đã xác nhận"
        })
        
    # Lấy log phát hiện gà
    detection_logs = db.query(DetectionLog).order_by(DetectionLog.created_at.desc()).limit(limit).all()
    for log in detection_logs:
        formatted_logs.append({
            "id": log.id,
            "type": "Hành vi/Sức khỏe",
            "image_url": f"/uploads/{log.annotated_image_path}",
            "result": f"{log.sick_count} gà bệnh / {log.total_chickens} tổng",
            "confidence": 0.0, # Detection không dùng single confidence cho cả ảnh
            "created_at": log.created_at,
            "status": "Cần chú ý" if log.sick_count > 0 else "Bình thường"
        })
    
    # Sắp xếp lại theo thời gian
    formatted_logs.sort(key=lambda x: x["created_at"], reverse=True)
    
    return formatted_logs[:limit]

# --- KNOWLEDGE BASE ENDPOINTS ---

@router.get("/diseases", response_model=List[DiseaseOut])
async def get_diseases(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy danh sách các bệnh"""
    diseases = db.query(Disease).offset(skip).limit(limit).all()
    return diseases

@router.get("/diseases/{disease_id}", response_model=DiseaseOut)
async def get_disease(
    disease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy chi tiết một bệnh"""
    disease = db.query(Disease).filter(Disease.id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh")
    return disease

@router.post("/diseases", response_model=DiseaseOut)
async def create_disease(
    disease_in: DiseaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Thêm mới bệnh và phác đồ điều trị"""
    
    # Check duplicate code
    if db.query(Disease).filter(Disease.code == disease_in.code).first():
        raise HTTPException(status_code=400, detail="Mã bệnh đã tồn tại")

    # 1. Create Disease
    disease_data = disease_in.dict(exclude={"treatment_steps"})
    disease = Disease(**disease_data)
    db.add(disease)
    db.flush() # Flush to get disease.id

    # 2. Create Treatment Steps & Medicines
    for step_in in disease_in.treatment_steps:
        step_data = step_in.dict(exclude={"medicines"})
        step = TreatmentStep(**step_data, disease_id=disease.id)
        db.add(step)
        db.flush() # Flush to get step.id
        
        for med_in in step_in.medicines:
            med = Medicine(**med_in.dict(), step_id=step.id)
    db.commit()
    db.refresh(disease)
    
    # Sync to Vector DB
    try:
        rag_service.sync_disease(disease.id)
    except Exception as e:
        print(f"Sync error: {e}")
        
    return disease

@router.put("/diseases/{disease_id}", response_model=DiseaseOut)
async def update_disease(
    disease_id: int,
    disease_in: DiseaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Cập nhật thông tin bệnh"""
    disease = db.query(Disease).filter(Disease.id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh")
    
    update_data = disease_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(disease, field, value)
        
    db.commit()
    db.refresh(disease)
    
    # Sync to Vector DB
    try:
        rag_service.sync_disease(disease.id)
    except Exception as e:
        print(f"Sync error: {e}")
        
    return disease

@router.delete("/diseases/{disease_id}")
async def delete_disease(
    disease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Xóa bệnh"""
    disease = db.query(Disease).filter(Disease.id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh")
    
    # Delete from Vector DB
    try:
        rag_service.delete_disease_vector(disease_id)
    except Exception as e:
        print(f"Delete vector error: {e}")

    db.delete(disease) # Cascade delete should handle steps/medicines
    db.commit()
    return {"message": "Đã xóa thành công"}

@router.get("/users")
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy danh sách người dùng"""
    users = db.query(User).offset(skip).limit(limit).all()
    # Mask password
    for user in users:
        user.hashed_password = "***"
    return users

@router.post("/users", response_model=UserOut)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Tạo người dùng mới"""
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="Email này đã được sử dụng.",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_superuser=user_in.is_superuser,
        is_active=user_in.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Cập nhật thông tin người dùng"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Người dùng không tồn tại",
        )
    user_data = user_in.dict(exclude_unset=True)
    if "password" in user_data and user_data["password"]:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        del user_data["password"]
        user.hashed_password = hashed_password
    
    for field, value in user_data.items():
        setattr(user, field, value)
        
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Xóa người dùng"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Người dùng không tồn tại",
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Không thể tự xóa chính mình",
        )
        
    db.delete(user)
    db.commit()
    return {"message": "Đã xóa người dùng thành công"}
