from pydantic import BaseModel
from typing import List, Optional

# 1. Medicine Schemas
class MedicineBase(BaseModel):
    name: str
    active_ingredient: Optional[str] = None
    manufacturer: Optional[str] = None
    dosage: str
    reference_source: Optional[str] = None

class MedicineCreate(MedicineBase):
    pass

class MedicineOut(MedicineBase):
    id: int
    step_id: int
    
    class Config:
        from_attributes = True

# 2. Treatment Step Schemas
class TreatmentStepBase(BaseModel):
    step_order: int
    description: str
    action: Optional[str] = None

class TreatmentStepCreate(TreatmentStepBase):
    medicines: List[MedicineCreate] = []

class TreatmentStepOut(TreatmentStepBase):
    id: int
    disease_id: int
    medicines: List[MedicineOut] = []
    
    class Config:
        from_attributes = True

# 3. Disease Schemas
class DiseaseBase(BaseModel):
    code: str
    name_vi: str
    name_en: Optional[str] = None
    symptoms: str
    cause: str
    prevention: str

class DiseaseCreate(DiseaseBase):
    treatment_steps: List[TreatmentStepCreate] = []

class DiseaseUpdate(BaseModel):
    name_vi: Optional[str] = None
    name_en: Optional[str] = None
    symptoms: Optional[str] = None
    cause: Optional[str] = None
    prevention: Optional[str] = None
    # Note: Updating nested steps/medicines is complex, usually handled separately or by replacing list

class DiseaseOut(DiseaseBase):
    id: int
    treatment_steps: List[TreatmentStepOut] = []
    
    class Config:
        from_attributes = True
