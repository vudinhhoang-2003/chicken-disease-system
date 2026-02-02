from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, case
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.models import DiagnosisLog, DetectionLog, User, Disease, TreatmentStep, Medicine, GeneralKnowledge
from app.api.deps import get_current_active_superuser
from app.schema.knowledge import DiseaseCreate, DiseaseOut, DiseaseUpdate, GeneralKnowledgeCreate, GeneralKnowledgeOut, GeneralKnowledgeUpdate
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
    
    # 1. Basic Counts
    total_diagnosis = db.query(DiagnosisLog).count()
    total_detections = db.query(DetectionLog).count()
    sick_cases = db.query(DiagnosisLog).filter(DiagnosisLog.predicted_disease != 'Healthy').count()
    
    # 2. Daily Stats (Last 7 Days)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=6)
    
    daily_query = db.query(
        cast(DiagnosisLog.created_at, Date).label('date'),
        func.count(DiagnosisLog.id).label('total'),
        func.sum(case((DiagnosisLog.predicted_disease != 'Healthy', 1), else_=0)).label('sick')
    ).filter(
        DiagnosisLog.created_at >= start_date
    ).group_by(cast(DiagnosisLog.created_at, Date)).all()
    
    # Map query result to list of days
    daily_stats = []
    current_day = start_date
    
    # Convert query result to dict for easy lookup
    data_map = {str(r.date): {'total': r.total, 'sick': r.sick or 0} for r in daily_query}
    
    while current_day <= end_date:
        day_str = current_day.strftime('%Y-%m-%d')
        # Display format: "Mon" or "02/02"
        display_name = current_day.strftime('%d/%m') 
        
        stat = data_map.get(day_str, {'total': 0, 'sick': 0})
        
        daily_stats.append({
            "name": display_name,
            "visits": stat['total'],
            "sick": stat['sick']
        })
        current_day += timedelta(days=1)

    # 3. Disease Distribution (Pie Chart)
    # Get top 5 diseases + Others
    dist_query = db.query(
        DiagnosisLog.predicted_disease, 
        func.count(DiagnosisLog.id)
    ).filter(
        DiagnosisLog.predicted_disease != 'Healthy'
    ).group_by(
        DiagnosisLog.predicted_disease
    ).order_by(func.count(DiagnosisLog.id).desc()).limit(5).all()
    
    # Healthy count
    healthy_count = total_diagnosis - sick_cases
    
    pie_data = [{"name": "Khỏe mạnh", "value": healthy_count}]
    for disease, count in dist_query:
        pie_data.append({"name": disease, "value": count})

    return {
        "total_diagnosis": total_diagnosis + total_detections,
        "sick_cases": sick_cases,
        "total_detections": total_detections,
        "total_fecal_analysis": total_diagnosis,
        "chart_data": daily_stats, # Real daily data
        "pie_data": pie_data       # Real distribution data
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

# --- GENERAL KNOWLEDGE ENDPOINTS ---

@router.get("/knowledge", response_model=List[GeneralKnowledgeOut])
async def get_general_knowledge(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy danh sách kiến thức chung"""
    return db.query(GeneralKnowledge).order_by(GeneralKnowledge.id.desc()).offset(skip).limit(limit).all()

@router.post("/knowledge", response_model=GeneralKnowledgeOut)
async def create_general_knowledge(
    knowledge_in: GeneralKnowledgeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Thêm kiến thức mới"""
    knowledge = GeneralKnowledge(**knowledge_in.dict())
    knowledge.sync_status = "PENDING"
    db.add(knowledge)
    db.commit()
    db.refresh(knowledge)
    
    # Sync in background
    background_tasks.add_task(rag_service.sync_general_knowledge, knowledge.id)
    return knowledge

@router.put("/knowledge/{k_id}", response_model=GeneralKnowledgeOut)
async def update_general_knowledge(
    k_id: int,
    knowledge_in: GeneralKnowledgeUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Cập nhật kiến thức"""
    knowledge = db.query(GeneralKnowledge).filter(GeneralKnowledge.id == k_id).first()
    if not knowledge:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
        
    for field, value in knowledge_in.dict(exclude_unset=True).items():
        setattr(knowledge, field, value)
    
    knowledge.sync_status = "PENDING"
    db.commit()
    db.refresh(knowledge)
    
    # Sync in background
    background_tasks.add_task(rag_service.sync_general_knowledge, knowledge.id)
    return knowledge

@router.delete("/knowledge/{k_id}")
async def delete_general_knowledge(
    k_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Xóa kiến thức"""
    knowledge = db.query(GeneralKnowledge).filter(GeneralKnowledge.id == k_id).first()
    if not knowledge:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
        
    try:
        rag_service.delete_general_knowledge_vector(k_id)
    except:
        pass
        
    db.delete(knowledge)
    db.commit()
    return {"message": "Đã xóa thành công"}

# --- DISEASE KNOWLEDGE BASE ENDPOINTS ---

@router.get("/diseases", response_model=List[DiseaseOut])
async def get_diseases(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy danh sách các bệnh"""
    diseases = db.query(Disease).order_by(Disease.id.desc()).offset(skip).limit(limit).all()
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
    background_tasks: BackgroundTasks,
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
    disease.sync_status = "PENDING" # Mark as pending
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
            db.add(med)
            
    db.commit()
    db.refresh(disease)
    
    # Sync to Vector DB in Background
    background_tasks.add_task(rag_service.sync_disease, disease.id)
        
    return disease

@router.put("/diseases/{disease_id}", response_model=DiseaseOut)
async def update_disease(
    disease_id: int,
    disease_in: DiseaseUpdate,
    background_tasks: BackgroundTasks,
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
    
    # Reset status to PENDING when updated
    disease.sync_status = "PENDING"
    disease.sync_error = None
        
    db.commit()
    db.refresh(disease)
    
    # Sync to Vector DB in Background
    background_tasks.add_task(rag_service.sync_disease, disease.id)
        
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
