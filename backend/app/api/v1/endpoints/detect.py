from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import cv2
import numpy as np
import base64
import os
import uuid
from typing import Any
from sqlalchemy.orm import Session, joinedload

from app.services.yolo_service import get_yolo_service, YOLOService
from app.schema.detection import DetectionResponse, ClassificationResponse, DetectionBox
from app.core.database import get_db
from app.core.models import DiagnosisLog, DetectionLog, User, Disease, TreatmentStep
from app.config import get_settings

router = APIRouter()
settings = get_settings()

@router.post("/detect", response_model=DetectionResponse)
async def detect_chickens(
    file: UploadFile = File(...),
    yolo_service: YOLOService = Depends(get_yolo_service),
    db: Session = Depends(get_db)
) -> Any:
    """
    Detect healthy and sick chickens in an image and save to database
    """
    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Run detection
    results = await yolo_service.detect_sick_chickens(image)
    
    # Save images
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    
    # 1. Original image
    orig_filename = f"{file_id}_orig{file_ext}"
    orig_rel_path = os.path.join("detections", orig_filename)
    orig_abs_path = os.path.join(settings.upload_dir, orig_rel_path)
    with open(orig_abs_path, "wb") as f:
        f.write(contents)
        
    # 2. Annotated image
    annot_filename = f"{file_id}_annot.jpg"
    annot_rel_path = os.path.join("detections", annot_filename)
    annot_abs_path = os.path.join(settings.upload_dir, annot_rel_path)
    cv2.imwrite(annot_abs_path, results["annotated_image"])
    
    # Save to Database
    db_log = DetectionLog(
        image_path=orig_rel_path,
        annotated_image_path=annot_rel_path,
        total_chickens=results["total_chickens"],
        healthy_count=results["healthy_count"],
        sick_count=results["sick_count"],
        raw_result=results["detections"]
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    # Convert annotated image to base64 for immediate display
    _, buffer = cv2.imencode('.jpg', results["annotated_image"])
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Map detections to schema
    detections = [
        DetectionBox(
            id=d["id"],
            class_name=d["class"],
            confidence=d["confidence"],
            bbox=d["bbox"]
        ) for d in results["detections"]
    ]
    
    return DetectionResponse(
        total_chickens=results["total_chickens"],
        healthy_count=results["healthy_count"],
        sick_count=results["sick_count"],
        detections=detections,
        has_sick_chickens=results["has_sick_chickens"],
        alert=results["alert"],
        image_base64=img_base64
    )

@router.post("/classify", response_model=ClassificationResponse)
async def classify_disease(
    file: UploadFile = File(...),
    yolo_service: YOLOService = Depends(get_yolo_service),
    db: Session = Depends(get_db)
) -> Any:
    """
    Classify chicken disease from a fecal image and save to database
    """
    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Save original image
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    relative_path = os.path.join("diagnoses", filename)
    file_path = os.path.join(settings.upload_dir, relative_path)
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Run classification
    results = await yolo_service.classify_disease(image)
    
    # Save to Database
    db_log = DiagnosisLog(
        image_path=relative_path,
        predicted_disease=results["disease"],
        confidence=results["confidence"],
        all_probabilities=results["all_probabilities"]
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)

    # Lookup Detailed Info from Knowledge Base
    disease_detail = None
    if not results["is_healthy"]:
        # Find disease in DB matching the English name from AI model (Case-insensitive)
        disease_info = db.query(Disease).options(
            joinedload(Disease.treatment_steps).joinedload(TreatmentStep.medicines)
        ).filter(Disease.name_en.ilike(results["disease"])).first()
        
        if disease_info:
            disease_detail = disease_info
    
    return ClassificationResponse(
        disease=results["disease"],
        confidence=results["confidence"],
        all_probabilities=results["all_probabilities"],
        is_healthy=results["is_healthy"],
        disease_detail=disease_detail
    )
