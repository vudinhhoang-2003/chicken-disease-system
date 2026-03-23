import os
from ultralytics import YOLO
import cv2
import numpy as np
from typing import Dict, List, Optional
import logging
from pathlib import Path
import torch
import imageio

# Thủ thuật (Monkeypatch) để qua mặt hàng rào cảnh báo bảo mật mới nhất của PyTorch 2.6+.
# Bắt buộc phải viết đè hàm torch.load này để thư viện Ultralytics YOLO cho phép nạp lại tệp weights an toàn.
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

    @staticmethod
    def _is_healthy_class(class_name: str) -> bool:
        """
        Resolve the model label to a health state using exact normalized names.
        This avoids brittle substring checks and keeps compatibility with
        `healthyChicken/sickChicken` and `normal/abnormal` style labels.
        """
        normalized = "".join(ch.lower() for ch in class_name if ch.isalnum())
        healthy_names = {"healthy", "healthychicken", "normal", "normalchicken"}
        sick_names = {"sick", "sickchicken", "abnormal", "abnormalchicken", "unhealthy", "unhealthychicken"}

        if normalized in healthy_names:
            return True
        if normalized in sick_names:
            return False

        return "healthy" in normalized and "unhealthy" not in normalized

    @staticmethod
    def _extract_detection_candidates(result) -> List[Dict]:
        candidates = []
        for idx, box in enumerate(result.boxes):
            class_id = int(box.cls)
            candidates.append({
                "source_index": idx,
                "class_id": class_id,
                "class_name": result.names[class_id],
                "confidence": float(box.conf),
                "bbox": [float(x) for x in box.xyxy[0].tolist()]
            })
        return candidates

    @staticmethod
    def _bbox_overlap_metrics(bbox_a: List[float], bbox_b: List[float]) -> tuple[float, float, float]:
        ax1, ay1, ax2, ay2 = bbox_a
        bx1, by1, bx2, by2 = bbox_b

        inter_x1 = max(ax1, bx1)
        inter_y1 = max(ay1, by1)
        inter_x2 = min(ax2, bx2)
        inter_y2 = min(ay2, by2)

        inter_w = max(0.0, inter_x2 - inter_x1)
        inter_h = max(0.0, inter_y2 - inter_y1)
        inter_area = inter_w * inter_h

        area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
        area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
        union = area_a + area_b - inter_area
        iou = inter_area / union if union > 0 else 0.0
        overlap_min = inter_area / min(area_a, area_b) if min(area_a, area_b) > 0 else 0.0

        return inter_area, iou, overlap_min

    @classmethod
    def _is_conflicting_same_chicken(cls, first: Dict, second: Dict) -> bool:
        if first["class_name"] == second["class_name"]:
            return False

        _, iou, overlap_min = cls._bbox_overlap_metrics(first["bbox"], second["bbox"])
        if iou < 0.75 and overlap_min < 0.9:
            return False

        fx1, fy1, fx2, fy2 = first["bbox"]
        sx1, sy1, sx2, sy2 = second["bbox"]
        first_diag = np.hypot(fx2 - fx1, fy2 - fy1)
        second_diag = np.hypot(sx2 - sx1, sy2 - sy1)
        min_diag = max(1.0, min(first_diag, second_diag))

        first_center = ((fx1 + fx2) / 2.0, (fy1 + fy2) / 2.0)
        second_center = ((sx1 + sx2) / 2.0, (sy1 + sy2) / 2.0)
        center_distance = np.hypot(first_center[0] - second_center[0], first_center[1] - second_center[1])

        return center_distance / min_diag <= 0.2

    @classmethod
    def _suppress_conflicting_candidates(cls, candidates: List[Dict]) -> List[Dict]:
        """
        Remove contradictory healthy/sick boxes only when they are almost surely
        the same chicken. This is narrower than agnostic NMS, so two chickens
        hiding behind each other are less likely to collapse into one box.
        """
        kept: List[Dict] = []

        for candidate in sorted(candidates, key=lambda item: item["confidence"], reverse=True):
            if any(cls._is_conflicting_same_chicken(candidate, existing) for existing in kept):
                continue
            kept.append(candidate)

        return sorted(kept, key=lambda item: item["source_index"])
    
    async def process_video(
        self,
        input_path: str,
        output_path: str,
        conf_threshold: float = 0.3,
        skip_frames: int = 3  # Số lượng khung hình sẽ ngủ/bỏ qua (để tối ưu CPU không phải chạy AI liên tục)
    ) -> Dict:
        """
        Xử lý stream Video được gửi lên:
        - Tối ưu 1: Ép độ phân giải về tiêu chuẩn 640p chiều rộng giúp quét vật thể tăng tốc 3-4 lần.
        - Tối ưu 2: Trích xuất frame bệnh xen kẽ để rèn thành ảnh GIF báo cáo nhanh nhẹ cho App Mobile,
          tránh user phải tải lại video MP4 nặng.
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
                results = self.detection_model(frame_resized, conf=conf_threshold, iou=0.45, verbose=False)
                processed_frames_count += 1
                frame_detections = self._suppress_conflicting_candidates(
                    self._extract_detection_candidates(results[0])
                )
                
                # Count stats
                current_sick = 0
                current_total = len(frame_detections)
                
                annotated_frame = frame_resized.copy()
                for detection in frame_detections:
                    class_name = detection["class_name"]
                    
                    is_healthy = self._is_healthy_class(class_name)
                    if not is_healthy:
                        current_sick += 1
                    
                    x1, y1, x2, y2 = map(int, detection["bbox"])
                    color = (0, 255, 0) if is_healthy else (0, 0, 255)
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                    label = f"{class_name} {detection['confidence']:.2f}"
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
        conf_threshold: float = 0.3
    ) -> Dict:
        """
        BƯỚC 1: Dò tìm và khoanh vùng (Detection) gà khỏe/bệnh trên tấm ảnh tĩnh.
        
        Args:
            image: Mảng numpy BGR (frame trích xuất).
            conf_threshold: Ngưỡng chấp nhận độ tự tin (tin cậy > 30% mới tính).
        
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
            results = self.detection_model(image, conf=conf_threshold, iou=0.45, verbose=False)
            filtered_detections = self._suppress_conflicting_candidates(
                self._extract_detection_candidates(results[0])
            )
            
            detections = []
            healthy_count = 0
            sick_count = 0
            
            # Process each detection and DRAW custom boxes
            annotated_image = image.copy()
            for idx, detection in enumerate(filtered_detections):
                class_name = detection["class_name"]
                confidence = detection["confidence"]
                bbox = detection["bbox"]  # [x1, y1, x2, y2]
                
                # Coords for cv2
                x1, y1, x2, y2 = map(int, bbox)
                
                # Determine color and count
                is_healthy = self._is_healthy_class(class_name)
                color = (0, 255, 0) if is_healthy else (0, 0, 255) # BGR
                
                if is_healthy:
                    healthy_count += 1
                else:
                    sick_count += 1

                # Draw Box - use thickness 2 for clearer view when many boxes exist
                cv2.rectangle(annotated_image, (x1, y1), (x2, y2), color, 2)
                
                # Draw Label - smaller scale 0.5 for crowded scenes
                label = f"{class_name} {confidence:.2f}"
                cv2.putText(annotated_image, label, (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

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


# Khai báo một thể hiện (Instance) duy nhất (Singleton Pattern) của bộ AI Computer Vision
_yolo_service: Optional[YOLOService] = None


def get_yolo_service() -> YOLOService:
    """
    Kích hoạt áp dụng Design Pattern: Singleton.
    Đảm bảo việc tải 2 file trọng số model khổng lồ (.pt) vào RAM chỉ diễn ra duy nhất 1 lần 
    khi server khởi động lên. Chặn đứng lỗi "Out of Memory" (Ngốn RAM) khi nhiều nông dân 
    cùng truy cập API tải ảnh lên 1 lúc (bất kể ai truy cập cũng chỉ dùng chung qua phiễu Object này).
    """
    global _yolo_service
    if _yolo_service is None:
        _yolo_service = YOLOService()
    return _yolo_service
