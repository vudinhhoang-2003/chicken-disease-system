# PROJECT 1: CHICKEN DISEASE CLASSIFICATION

## Mô tả
Phân loại bệnh gà dựa trên ảnh phân (fecal images) thành 4 loại:
- Coccidiosis
- Salmonella
- Newcastle Disease
- Healthy

## Dataset
- **Số ảnh:** 8,069 ảnh (train_aug.csv)
- **Classes:** 4
- **Location:** `data/data_phan_chicken/`

## Model
- **Architecture:** YOLOv8n-cls (Classification)
- **Performance:** 
  - Top-1 Accuracy: 97.27%
  - Top-5 Accuracy: 100%
  - **KHÔNG overfitting** (gap 1.35%)

## Files
- `notebooks/train_yolov8_cls.ipynb` - Training notebook
- `notebooks/explore_data_phan_chicken.ipynb` - Data exploration
- `scripts/visualize_data_phan_chicken.py` - Visualization
- `scripts/analyze_overfitting.py` - Overfitting analysis
- `models/yolov8n-cls.pt` - Pretrained model
- `results/runs/chicken_disease/weights/best.pt` - Trained model

## Status
✅ **HOÀN THÀNH** - Model đã train xong, performance tốt (97.27%)
