from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, case
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.models import DiagnosisLog, DetectionLog, User, Disease, TreatmentStep, Medicine, GeneralKnowledge, Setting, UsageLog
from app.api.deps import get_current_active_superuser
from app.schema.knowledge import DiseaseCreate, DiseaseOut, DiseaseUpdate, GeneralKnowledgeCreate, GeneralKnowledgeOut, GeneralKnowledgeUpdate, SettingCreate, SettingOut
from app.schema.user import UserCreate, UserUpdate, UserOut
from app.core.security import get_password_hash
from app.services.rag_service import get_rag_service
from langchain.schema import HumanMessage

router = APIRouter()
rag_service = get_rag_service()

# --- SYSTEM SETTINGS ENDPOINTS ---

@router.post("/test-ai")
async def test_ai_connection(
    config: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Kiểm tra thử Key AI có hoạt động không (Hỗ trợ Write-Only pattern)"""
    provider = config.get("ai_provider")
    model_name = config.get("ai_model")
    
    try:
        if provider == "groq":
            api_key = config.get("ai_groq_key")
            # Nếu nhận được mask từ UI, lấy key thật từ DB
            if api_key == "********":
                db_setting = db.query(Setting).filter(Setting.key == "ai_groq_key").first()
                api_key = db_setting.value if db_setting else None
                
            if not api_key: raise Exception("Thiếu Groq API Key")
            from langchain_groq import ChatGroq
            llm = ChatGroq(groq_api_key=api_key, model_name=model_name, temperature=0)
            
        elif provider == "gemini":
            api_key = config.get("ai_gemini_key")
            # Nếu nhận được mask từ UI, lấy key thật từ DB
            if api_key == "********":
                db_setting = db.query(Setting).filter(Setting.key == "ai_gemini_key").first()
                api_key = db_setting.value if db_setting else None
                
            if not api_key: raise Exception("Thiếu Gemini API Key")
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(google_api_key=api_key, model=model_name, temperature=0)
        else:
            raise Exception("Nhà cung cấp không hợp lệ")

        # Thử gửi một câu hỏi ngắn
        response = await llm.ainvoke([HumanMessage(content="Hello, respond with 'OK' only.")])
        return {"status": "success", "message": "Kết nối thành công!", "response": response.content}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/settings", response_model=List[SettingOut])
async def get_settings_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy danh sách cấu hình hệ thống (có che giấu Key quan trọng)"""
    settings = db.query(Setting).all()
    
    # Tạo bản sao để không ảnh hưởng đến DB thực
    masked_settings = []
    for s in settings:
        s_dict = {
            "id": s.id,
            "key": s.key,
            "value": s.value,
            "description": s.description,
            "updated_at": s.updated_at
        }
        
        # Nếu là các key nhạy cảm, thực hiện che giấu hoàn toàn (Write-Only pattern)
        if s.key in ["ai_groq_key", "ai_gemini_key"] and s.value:
            s_dict["value"] = "********"
                
        masked_settings.append(s_dict)
        
    return masked_settings

@router.post("/settings", response_model=SettingOut)
async def update_setting(
    setting_in: SettingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Cập nhật hoặc thêm mới cấu hình"""
    db_setting = db.query(Setting).filter(Setting.key == setting_in.key).first()
    
    # Logic cập nhật theo chuẩn "Write-Only":
    # Nếu giá trị gửi lên là '********' (mask), nghĩa là người dùng không thay đổi -> Giữ nguyên DB cũ.
    # Nếu giá trị khác -> Người dùng đang nhập Key mới -> Cập nhật vào DB.
    should_update_value = True
    if setting_in.key in ["ai_groq_key", "ai_gemini_key"]:
        if setting_in.value == "********":
            should_update_value = False
    
    if db_setting:
        if should_update_value:
            db_setting.value = setting_in.value
        db_setting.description = setting_in.description
    else:
        # Nếu tạo mới mà gửi mask thì không hợp lệ (nhưng cứ lưu để tránh lỗi, thực tế UI sẽ bắt nhập)
        db_setting = Setting(**setting_in.dict())
        db.add(db_setting)
    
    db.commit()
    db.refresh(db_setting)
    
    # Tạo một dict để trả về, đảm bảo không sửa trực tiếp vào db_setting object
    # để tránh việc SQLAlchemy tự động lưu '********' vào DB
    result = {
        "id": db_setting.id,
        "key": db_setting.key,
        "value": db_setting.value,
        "description": db_setting.description,
        "updated_at": db_setting.updated_at
    }

    # Re-init RAG Service to apply new config
    try:
        rs = get_rag_service()
        rs._initialize_llm()
    except Exception as e:
        print(f"Error re-initializing LLM: {e}")
    
    # Che giấu giá trị trước khi trả về cho Frontend
    if result["key"] in ["ai_groq_key", "ai_gemini_key"]:
        result["value"] = "********"
        
    return result

@router.get("/usage-stats")
async def get_usage_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy số liệu thống kê sử dụng AI"""
    total_logs = db.query(UsageLog).count()
    total_tokens = db.query(func.sum(UsageLog.total_tokens)).scalar() or 0
    end_date = datetime.now()
    start_date = end_date - timedelta(days=6)
    daily_usage = db.query(
        cast(UsageLog.created_at, Date).label('date'),
        func.count(UsageLog.id).label('count'),
        func.sum(UsageLog.total_tokens).label('tokens')
    ).filter(UsageLog.created_at >= start_date).group_by(cast(UsageLog.created_at, Date)).all()
    usage_chart = []
    current_day = start_date
    usage_map = {str(r.date): {'count': r.count, 'tokens': r.tokens or 0} for r in daily_usage}
    while current_day <= end_date:
        day_str = current_day.strftime('%Y-%m-%d')
        display_name = current_day.strftime('%d/%m')
        data = usage_map.get(day_str, {'count': 0, 'tokens': 0})
        usage_chart.append({"name": display_name, "requests": data['count'], "tokens": data['tokens']})
        current_day += timedelta(days=1)
    feature_dist = db.query(UsageLog.feature, func.count(UsageLog.id)).group_by(UsageLog.feature).all()
    feature_data = [{"name": f.capitalize(), "value": c} for f, c in feature_dist]
    return {
        "total_requests": total_logs,
        "total_tokens": total_tokens,
        "daily_usage": usage_chart,
        "feature_distribution": feature_data
    }

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
    data_map = {str(r.date): {'total': r.total, 'sick': r.sick or 0} for r in daily_query}
    
    while current_day <= end_date:
        day_str = current_day.strftime('%Y-%m-%d')
        display_name = current_day.strftime('%d/%m') 
        stat = data_map.get(day_str, {'total': 0, 'sick': 0})
        daily_stats.append({
            "name": display_name,
            "visits": stat['total'],
            "sick": stat['sick']
        })
        current_day += timedelta(days=1)

    # 3. Disease Distribution (Pie Chart)
    dist_query = db.query(
        DiagnosisLog.predicted_disease, 
        func.count(DiagnosisLog.id)
    ).filter(
        DiagnosisLog.predicted_disease != 'Healthy'
    ).group_by(
        DiagnosisLog.predicted_disease
    ).order_by(func.count(DiagnosisLog.id).desc()).limit(5).all()
    
    healthy_count = total_diagnosis - sick_cases
    pie_data = [{"name": "Khỏe mạnh", "value": healthy_count}]
    for disease, count in dist_query:
        pie_data.append({"name": disease, "value": count})

    return {
        "total_diagnosis": total_diagnosis + total_detections,
        "sick_cases": sick_cases,
        "total_detections": total_detections,
        "total_fecal_analysis": total_diagnosis,
        "chart_data": daily_stats,
        "pie_data": pie_data
    }

@router.get("/recent-logs")
async def get_recent_logs(
    db: Session = Depends(get_db), 
    limit: int = 20,
    current_user: User = Depends(get_current_active_superuser)
):
    """Lấy danh sách các chẩn đoán mới nhất"""
    diagnosis_logs = db.query(DiagnosisLog).order_by(DiagnosisLog.created_at.desc()).limit(limit).all()
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
        
    detection_logs = db.query(DetectionLog).order_by(DetectionLog.created_at.desc()).limit(limit).all()
    for log in detection_logs:
        formatted_logs.append({
            "id": log.id,
            "type": "Hành vi/Sức khỏe",
            "image_url": f"/uploads/{log.annotated_image_path}",
            "result": f"{log.sick_count} gà bệnh / {log.total_chickens} tổng",
            "confidence": 0.0,
            "created_at": log.created_at,
            "status": "Cần chú ý" if log.sick_count > 0 else "Bình thường"
        })
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
    return db.query(GeneralKnowledge).order_by(GeneralKnowledge.id.desc()).offset(skip).limit(limit).all()

@router.post("/knowledge", response_model=GeneralKnowledgeOut)
async def create_general_knowledge(
    knowledge_in: GeneralKnowledgeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    knowledge = GeneralKnowledge(**knowledge_in.dict())
    knowledge.sync_status = "PENDING"
    db.add(knowledge)
    db.commit()
    db.refresh(knowledge)
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
    knowledge = db.query(GeneralKnowledge).filter(GeneralKnowledge.id == k_id).first()
    if not knowledge:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    for field, value in knowledge_in.dict(exclude_unset=True).items():
        setattr(knowledge, field, value)
    knowledge.sync_status = "PENDING"
    db.commit()
    db.refresh(knowledge)
    background_tasks.add_task(rag_service.sync_general_knowledge, knowledge.id)
    return knowledge

@router.delete("/knowledge/{k_id}")
async def delete_general_knowledge(
    k_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
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
    diseases = db.query(Disease).order_by(Disease.id.desc()).offset(skip).limit(limit).all()
    return diseases

@router.get("/diseases/{disease_id}", response_model=DiseaseOut)
async def get_disease(
    disease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
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
    if db.query(Disease).filter(Disease.code == disease_in.code).first():
        raise HTTPException(status_code=400, detail="Mã bệnh đã tồn tại")
    disease_data = disease_in.dict(exclude={"treatment_steps"})
    disease = Disease(**disease_data)
    disease.sync_status = "PENDING"
    db.add(disease)
    db.flush()
    for step_in in disease_in.treatment_steps:
        step_data = step_in.dict(exclude={"medicines"})
        step = TreatmentStep(**step_data, disease_id=disease.id)
        db.add(step)
        db.flush()
        for med_in in step_in.medicines:
            med = Medicine(**med_in.dict(), step_id=step.id)
            db.add(med)
    db.commit()
    db.refresh(disease)
    background_tasks.add_task(rag_service.sync_disease, disease.id)
    return disease

@router.put("/diseases/{disease_id}", response_model=DiseaseOut)
async def update_disease(
    disease_id: int,
    disease_in: DiseaseCreate, # Sử dụng DiseaseCreate để nhận được cả treatment_steps
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    disease = db.query(Disease).filter(Disease.id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh")
    
    # 1. Cập nhật thông tin cơ bản
    disease.name_vi = disease_in.name_vi
    disease.name_en = disease_in.name_en
    disease.symptoms = disease_in.symptoms
    disease.cause = disease_in.cause
    disease.prevention = disease_in.prevention
    disease.source = disease_in.source
    
    # 2. Cập nhật phác đồ: Xóa hết cũ, thêm mới (Logic đơn giản và hiệu quả nhất cho MVP)
    # Xóa các steps cũ (Medicines sẽ tự xóa theo nhờ cascade delete-orphan)
    db.query(TreatmentStep).filter(TreatmentStep.disease_id == disease.id).delete()
    
    # Thêm các steps mới
    for step_in in disease_in.treatment_steps:
        step_data = step_in.dict(exclude={"medicines"})
        step = TreatmentStep(**step_data, disease_id=disease.id)
        db.add(step)
        db.flush()
        for med_in in step_in.medicines:
            med = Medicine(**med_in.dict(), step_id=step.id)
            db.add(med)

    disease.sync_status = "PENDING"
    disease.sync_error = None
    db.commit()
    db.refresh(disease)
    background_tasks.add_task(rag_service.sync_disease, disease.id)
    return disease

@router.delete("/diseases/{disease_id}")
async def delete_disease(
    disease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    disease = db.query(Disease).filter(Disease.id == disease_id).first()
    if not disease:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh")
    try:
        rag_service.delete_disease_vector(disease_id)
    except Exception as e:
        print(f"Delete vector error: {e}")
    db.delete(disease)
    db.commit()
    return {"message": "Đã xóa thành công"}

@router.get("/users")
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    users = db.query(User).offset(skip).limit(limit).all()
    for user in users:
        user.hashed_password = "***"
    return users

@router.post("/users", response_model=UserOut)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng.")
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
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    user_data = user_in.dict(exclude_unset=True)
    if "password" in user_data and user_data["password"]:
        user.hashed_password = get_password_hash(user_data["password"])
        del user_data["password"]
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
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Không thể tự xóa chính mình")
    db.delete(user)
    db.commit()
    return {"message": "Đã xóa người dùng thành công"}