import os
from ultralytics import YOLO
import cv2
import numpy as np
from typing import Dict, List, Optional
import logging
from pathlib import Path
import torch
import imageio

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
    
    async def process_video(
        self,
        input_path: str,
        output_path: str,
        conf_threshold: float = 0.5,
        skip_frames: int = 5  # Tăng skip lên 5 (xử lý 1 frame, bỏ 5 frame)
    ) -> Dict:
        """
        Process video file with optimization: Resize to 640p for speed.
        """
        if self.detection_model is None:
            raise RuntimeError("Detection model not loaded")

        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise RuntimeError("Could not open video file")

        # Get original properties
        orig_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
        
        # Target Resize (Standard YOLO size) -> Speed up 3x-4x
        target_w = 640
        scale = target_w / orig_width
        target_h = int(orig_height * scale)
        
        # Define codec
        fourcc = cv2.VideoWriter_fourcc(*'avc1') 
        out = cv2.VideoWriter(output_path, fourcc, fps, (target_w, target_h))
        
        frame_count = 0
        max_sick = 0
        max_total = 0
        total_sick_accum = 0
        processed_frames_count = 0
        
        last_annotated_frame = None 
        gif_frames = [] 
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Resize frame immediately
            frame_resized = cv2.resize(frame, (target_w, target_h))
            
            # Process frame logic
            if frame_count % (skip_frames + 1) == 0:
                results = self.detection_model(frame_resized, conf=conf_threshold, verbose=False)
                processed_frames_count += 1
                
                # Count stats
                current_sick = 0
                current_total = 0
                
                annotated_frame = frame_resized.copy()
                for box in results[0].boxes:
                    current_total += 1
                    class_id = int(box.cls)
                    class_name = results[0].names[class_id]
                    
                    is_healthy = "healthy" in class_name.lower()
                    if not is_healthy:
                        current_sick += 1
                    
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    color = (0, 255, 0) if is_healthy else (0, 0, 255)
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                    label = f"{class_name} {box.conf[0]:.2f}"
                    cv2.putText(annotated_frame, label, (x1, y1 - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                max_sick = max(max_sick, current_sick)
                max_total = max(max_total, current_total)
                total_sick_accum += current_sick
                
                last_annotated_frame = annotated_frame
                
                # Collect frames for GIF (Sampling)
                if len(gif_frames) < 60: # Limit GIF size
                    rgb_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
                    # Resize smaller for GIF
                    gif_h, gif_w = rgb_frame.shape[:2]
                    gif_scale = 320 / gif_w
                    gif_frame = cv2.resize(rgb_frame, (320, int(gif_h * gif_scale)))
                    gif_frames.append(gif_frame)
                
            else:
                # Use last known frame for skipped ones to keep video smooth
                annotated_frame = last_annotated_frame if last_annotated_frame is not None else frame_resized

            out.write(annotated_frame)
            frame_count += 1

        cap.release()
        out.release()
        
        # Save GIF
        gif_path = output_path.replace('.mp4', '.gif')
        if gif_frames:
            imageio.mimsave(gif_path, gif_frames, fps=8, loop=0)
        
        return {
            "total_frames": frame_count,
            "processed_frames": processed_frames_count,
            "max_total_chickens": max_total,
            "max_sick_chickens": max_sick,
            "avg_sick_chickens": round(total_sick_accum / max(1, processed_frames_count), 1),
            "has_sick_chickens": max_sick > 0,
            "gif_path": gif_path,
            "alert": f"Phát hiện tối đa {max_sick} gà bệnh trong video." if max_sick > 0 else None
        }

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
