from pydantic import BaseModel
from typing import List, Optional, Dict
from app.schema.knowledge import DiseaseOut

class DetectionBox(BaseModel):
    id: int
    class_name: str
    confidence: float
    bbox: List[float]

class DetectionResponse(BaseModel):
    total_chickens: int
    healthy_count: int
    sick_count: int
    detections: List[DetectionBox]
    has_sick_chickens: bool
    alert: Optional[str] = None
    image_base64: Optional[str] = None

class ClassificationResponse(BaseModel):
    disease: str
    confidence: float
    all_probabilities: Dict[str, float]
    is_healthy: bool
    description: Optional[str] = None
    recommendation: Optional[str] = None
    disease_detail: Optional[DiseaseOut] = None # Thông tin chi tiết từ DB (thuốc, phác đồ...)
