from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import cv2
import numpy as np
import base64
from typing import Any

from app.services.yolo_service import get_yolo_service, YOLOService
from app.schema.detection import DetectionResponse, ClassificationResponse, DetectionBox

router = APIRouter()

@router.post("/detect", response_model=DetectionResponse)
async def detect_chickens(
    file: UploadFile = File(...),
    yolo_service: YOLOService = Depends(get_yolo_service)
) -> Any:
    """
    Detect healthy and sick chickens in an image
    """
    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Run detection
    results = await yolo_service.detect_sick_chickens(image)
    
    # Convert annotated image to base64
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
    yolo_service: YOLOService = Depends(get_yolo_service)
) -> Any:
    """
    Classify chicken disease from a fecal image
    """
    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Run classification
    results = await yolo_service.classify_disease(image)
    
    return ClassificationResponse(
        disease=results["disease"],
        confidence=results["confidence"],
        all_probabilities=results["all_probabilities"],
        is_healthy=results["is_healthy"]
    )
