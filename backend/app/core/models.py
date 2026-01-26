from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# 1. Bảng Người dùng
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="farmer") # farmer, vet, admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    flocks = relationship("Flock", back_populates="owner")
    detections = relationship("DetectionLog", back_populates="user")
    diagnoses = relationship("DiagnosisLog", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")

# 2. Bảng Đàn gà (Quản lý theo lứa/chuồng)
class Flock(Base):
    __tablename__ = "flocks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String) # VD: Chuồng số 1
    type = Column(String) # VD: Gà thịt, Gà đẻ
    total_quantity = Column(Integer) # Tổng đàn ban đầu
    start_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    
    owner = relationship("User", back_populates="flocks")
    detections = relationship("DetectionLog", back_populates="flock")
    diagnoses = relationship("DiagnosisLog", back_populates="flock")

# 3. Log Phát hiện (Kết quả Bước 1 - Detection)
class DetectionLog(Base):
    __tablename__ = "detection_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flock_id = Column(Integer, ForeignKey("flocks.id"), nullable=True)
    
    image_path = Column(String) # Đường dẫn ảnh gốc lưu trên server
    annotated_image_path = Column(String) # Đường dẫn ảnh vẽ box
    
    total_chickens = Column(Integer)
    healthy_count = Column(Integer)
    sick_count = Column(Integer)
    
    # Lưu chi tiết tọa độ box dưới dạng JSON
    raw_result = Column(JSON, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="detections")
    flock = relationship("Flock", back_populates="detections")

# 4. Log Chẩn đoán bệnh (Kết quả Bước 2 - Classification)
class DiagnosisLog(Base):
    __tablename__ = "diagnosis_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    flock_id = Column(Integer, ForeignKey("flocks.id"), nullable=True)
    
    image_path = Column(String)
    predicted_disease = Column(String) # VD: Coccidiosis
    confidence = Column(Float) # VD: 0.95
    all_probabilities = Column(JSON, nullable=True)
    
    # Cho phép bác sĩ thú y xác nhận lại đúng/sai -> Dùng để train lại model sau này
    verified_result = Column(String, nullable=True) 
    is_correct = Column(Boolean, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="diagnoses")
    flock = relationship("Flock", back_populates="diagnoses")

# 5. Chat History
class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String) # 'user' hoặc 'ai' (thay đổi từ sender cho chuẩn role)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("ChatSession", back_populates="messages")

# 6. Knowledge Base (Dữ liệu bệnh học & Phác đồ)
class Disease(Base):
    __tablename__ = "diseases"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # VD: DIS_01
    name_vi = Column(String, index=True)
    name_en = Column(String)
    symptoms = Column(Text) # Triệu chứng
    cause = Column(Text) # Nguyên nhân
    prevention = Column(Text) # Phòng bệnh
    
    treatment_steps = relationship("TreatmentStep", back_populates="disease", cascade="all, delete-orphan")

class TreatmentStep(Base):
    __tablename__ = "treatment_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(Integer, ForeignKey("diseases.id"))
    step_order = Column(Integer) # Bước 1, Bước 2...
    description = Column(Text)
    action = Column(String, nullable=True) # Hành động cụ thể nếu không dùng thuốc
    
    disease = relationship("Disease", back_populates="treatment_steps")
    medicines = relationship("Medicine", back_populates="step", cascade="all, delete-orphan")

class Medicine(Base):
    __tablename__ = "medicines"
    
    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("treatment_steps.id"))
    
    name = Column(String) # Tên thuốc
    active_ingredient = Column(String, nullable=True) # Hoạt chất
    manufacturer = Column(String, nullable=True) # Nhà sản xuất
    dosage = Column(String) # Liều dùng
    reference_source = Column(String, nullable=True)
    
    step = relationship("TreatmentStep", back_populates="medicines")
