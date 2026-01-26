# PROJECT 2: CHICKEN DETECTION (HEALTHY vs SICK)

## Mô tả
Phát hiện và phân loại gà khỏe mạnh vs gà bệnh trong ảnh toàn cảnh (object detection)

## Dataset
- **Merged dataset:** 3,175 ảnh
  - Train: 2,781 ảnh
  - Valid: 277 ảnh
  - Test: 117 ảnh
- **Classes:** 2
  - Class 0: healthyChicken
  - Class 1: sickChicken
- **Location:** `data/merged_dataset/`

## Nguồn dữ liệu
1. Dataset gốc: 382 ảnh (data_chicken_behavior)
2. Roboflow: 2,793 ảnh (data_chicken_behavior_2)
3. **Đã merge và convert class IDs**

## Model
- **Architecture:** YOLOv8/YOLOv11 (Object Detection)
- **Pretrained:** `models/yolo11n.pt`

## Files
- `data/merged_dataset/data.yaml` - Dataset config
- `scripts/analyze_behavior_dataset.py` - Dataset analysis
- `models/yolo11n.pt` - Pretrained model
- `MERGE_SUCCESS_REPORT.md` - Merge report
- `DATASET_ANALYSIS_REPORT.md` - Analysis report

## Status
⏳ **CHƯA TRAIN** - Dataset đã sẵn sàng, chờ training

## Bước tiếp theo
1. Train YOLOv8/YOLOv11 với merged dataset
2. Đánh giá performance
3. So sánh với baseline
