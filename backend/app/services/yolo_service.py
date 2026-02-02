"""YOLO Service for chicken disease detection and classification"""

from ultralytics import YOLO
import cv2
import numpy as np
from typing import Dict, List, Optional
import logging
from pathlib import Path
import torch

# Fix for PyTorch 2.6+ weights_only loading issue with Ultralytics
# Monkeypatch torch.load to default to weights_only=False
original_torch_load = torch.load
def patched_torch_load(*args, **kwargs):
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return original_torch_load(*args, **kwargs)
torch.load = patched_torch_load

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class YOLOService:
    """Service for YOLO-based chicken disease detection and classification"""
    
    def __init__(self):
        """Initialize YOLO models"""
        self.detection_model: Optional[YOLO] = None
        self.classification_model: Optional[YOLO] = None
        self._load_models()
    
    def _load_models(self):
        """Load YOLO models from disk"""
        try:
            # Load Detection Model (YOLOv8n)
            detection_path = Path(settings.detection_model_path)
            if detection_path.exists():
                logger.info(f"Loading detection model from {detection_path}")
                self.detection_model = YOLO(str(detection_path))
                logger.info("✅ Detection model loaded successfully")
            else:
                logger.warning(f"⚠️ Detection model not found at {detection_path}")
            
            # Load Classification Model (YOLOv8n-cls)
            classification_path = Path(settings.classification_model_path)
            if classification_path.exists():
                logger.info(f"Loading classification model from {classification_path}")
                self.classification_model = YOLO(str(classification_path))
                logger.info("✅ Classification model loaded successfully")
            else:
                logger.warning(f"⚠️ Classification model not found at {classification_path}")
                
        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            raise
    
    async def detect_sick_chickens(
        self, 
        image: np.ndarray, 
        conf_threshold: float = 0.6
    ) -> Dict:
        """
        STEP 1: Detect healthy/sick chickens in image
        
        Args:
            image: Input image as numpy array (BGR format)
            conf_threshold: Confidence threshold for detection (default: 0.6)
        
        Returns:
            Dictionary containing:
            - total_chickens: Total number of chickens detected
            - healthy_count: Number of healthy chickens
            - sick_count: Number of sick chickens
            - detections: List of detection objects
            - annotated_image: Image with bounding boxes drawn
            - has_sick_chickens: Boolean flag
            - alert: Alert message if sick chickens detected
        """
        if self.detection_model is None:
            raise RuntimeError("Detection model not loaded")
        
        try:
            # Run inference
            results = self.detection_model(image, conf=conf_threshold, verbose=False)
            
            detections = []
            healthy_count = 0
            sick_count = 0
            
            # Process each detection and DRAW custom boxes
            annotated_image = image.copy()
            for idx, box in enumerate(results[0].boxes):
                class_id = int(box.cls)
                class_name = results[0].names[class_id]
                confidence = float(box.conf)
                bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                
                # Coords for cv2
                x1, y1, x2, y2 = map(int, bbox)
                
                # Determine color and count
                is_healthy = "healthy" in class_name.lower()
                color = (0, 255, 0) if is_healthy else (0, 0, 255) # BGR
                
                if is_healthy:
                    healthy_count += 1
                else:
                    sick_count += 1

                # Draw Box
                cv2.rectangle(annotated_image, (x1, y1), (x2, y2), color, 3)
                
                # Draw Label
                label = f"{class_name} {confidence:.2f}"
                cv2.putText(annotated_image, label, (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

                detection = {
                    "id": idx + 1,
                    "class": class_name,
                    "confidence": round(confidence, 3),
                    "bbox": [round(x, 2) for x in bbox]
                }
                detections.append(detection)
            
            # Generate alert message
            alert = None
            if sick_count > 0:
                alert = f"⚠️ Phát hiện {sick_count} cá thể có dấu hiệu bất thường. Cần kiểm tra kỹ chuồng trại."
            
            return {
                "total_chickens": len(detections),
                "healthy_count": healthy_count,
                "sick_count": sick_count,
                "detections": detections,
                "annotated_image": annotated_image,
                "has_sick_chickens": sick_count > 0,
                "alert": alert
            }
            
        except Exception as e:
            logger.error(f"Error in detect_sick_chickens: {e}")
            raise
    
    async def classify_disease(self, image: np.ndarray) -> Dict:
        """
        STEP 2: Classify disease from fecal image
        
        Args:
            image: Input fecal image as numpy array (BGR format)
        
        Returns:
            Dictionary containing:
            - disease: Predicted disease name
            - confidence: Confidence score (0-1)
            - all_probabilities: Dictionary of all class probabilities
            - is_healthy: Boolean flag
        """
        if self.classification_model is None:
            raise RuntimeError("Classification model not loaded")
        
        try:
            # Run inference
            results = self.classification_model(image, verbose=False)
            
            # Get probabilities
            probs = results[0].probs
            top1_idx = int(probs.top1)
            top1_conf = float(probs.top1conf)
            
            # Get class name
            disease = results[0].names[top1_idx]
            
            # Get all probabilities
            all_probs = {}
            for idx, prob in enumerate(probs.data.tolist()):
                class_name = results[0].names[idx]
                all_probs[class_name] = round(prob, 4)
            
            return {
                "disease": disease,
                "confidence": round(top1_conf, 4),
                "all_probabilities": all_probs,
                "is_healthy": disease.lower() == "healthy"
            }
            
        except Exception as e:
            logger.error(f"Error in classify_disease: {e}")
            raise


# Global instance
_yolo_service: Optional[YOLOService] = None


def get_yolo_service() -> YOLOService:
    """Get or create YOLO service singleton"""
    global _yolo_service
    if _yolo_service is None:
        _yolo_service = YOLOService()
    return _yolo_service
