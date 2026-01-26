"""
Script tự động tổ chức lại cấu trúc dự án thành 2 projects riêng biệt
"""

import os
import shutil
from pathlib import Path

print("="*80)
print("TỔ CHỨC LẠI CẤU TRÚC DỰ ÁN")
print("="*80)

ROOT = Path(r'd:\train_chicken')

# Tạo cấu trúc mới
print("\n1. Tạo cấu trúc thư mục mới...")

# Project 1: Classification
(ROOT / '01_classification' / 'data').mkdir(parents=True, exist_ok=True)
(ROOT / '01_classification' / 'notebooks').mkdir(parents=True, exist_ok=True)
(ROOT / '01_classification' / 'scripts').mkdir(parents=True, exist_ok=True)
(ROOT / '01_classification' / 'models').mkdir(parents=True, exist_ok=True)
(ROOT / '01_classification' / 'results').mkdir(parents=True, exist_ok=True)

# Project 2: Detection
(ROOT / '02_detection' / 'data').mkdir(parents=True, exist_ok=True)
(ROOT / '02_detection' / 'scripts').mkdir(parents=True, exist_ok=True)
(ROOT / '02_detection' / 'models').mkdir(parents=True, exist_ok=True)

# Archive
(ROOT / 'archive').mkdir(parents=True, exist_ok=True)

print("✓ Đã tạo cấu trúc thư mục")

# Di chuyển files
print("\n2. Di chuyển files vào đúng project...")

# === PROJECT 1: CLASSIFICATION ===
print("\n  → Project 1: Classification")

# Data
if (ROOT / 'data' / 'data_phan_chicken').exists():
    shutil.move(str(ROOT / 'data' / 'data_phan_chicken'), 
                str(ROOT / '01_classification' / 'data' / 'data_phan_chicken'))
    print("    ✓ data_phan_chicken")

if (ROOT / 'yolo_dataset').exists():
    shutil.move(str(ROOT / 'yolo_dataset'), 
                str(ROOT / '01_classification' / 'data' / 'yolo_dataset'))
    print("    ✓ yolo_dataset")

# Notebooks
if (ROOT / 'train_yolov8_cls.ipynb').exists():
    shutil.move(str(ROOT / 'train_yolov8_cls.ipynb'), 
                str(ROOT / '01_classification' / 'notebooks' / 'train_yolov8_cls.ipynb'))
    print("    ✓ train_yolov8_cls.ipynb")

if (ROOT / 'explore_data_phan_chicken.ipynb').exists():
    shutil.move(str(ROOT / 'explore_data_phan_chicken.ipynb'), 
                str(ROOT / '01_classification' / 'notebooks' / 'explore_data_phan_chicken.ipynb'))
    print("    ✓ explore_data_phan_chicken.ipynb")

# Scripts
if (ROOT / 'visualize_data_phan_chicken.py').exists():
    shutil.move(str(ROOT / 'visualize_data_phan_chicken.py'), 
                str(ROOT / '01_classification' / 'scripts' / 'visualize_data_phan_chicken.py'))
    print("    ✓ visualize_data_phan_chicken.py")

if (ROOT / 'analyze_overfitting.py').exists():
    shutil.move(str(ROOT / 'analyze_overfitting.py'), 
                str(ROOT / '01_classification' / 'scripts' / 'analyze_overfitting.py'))
    print("    ✓ analyze_overfitting.py")

# Models
if (ROOT / 'yolov8n-cls.pt').exists():
    shutil.move(str(ROOT / 'yolov8n-cls.pt'), 
                str(ROOT / '01_classification' / 'models' / 'yolov8n-cls.pt'))
    print("    ✓ yolov8n-cls.pt")

# Results
if (ROOT / 'runs' / 'classify').exists():
    shutil.move(str(ROOT / 'runs' / 'classify'), 
                str(ROOT / '01_classification' / 'results' / 'runs'))
    print("    ✓ runs/classify")

# Visualizations
for png in ROOT.glob('*.png'):
    if 'overfitting' in png.name or 'phan_bo' in png.name or 'anh_mau' in png.name or 'ty_le' in png.name:
        shutil.move(str(png), str(ROOT / '01_classification' / 'results' / png.name))
        print(f"    ✓ {png.name}")

# === PROJECT 2: DETECTION ===
print("\n  → Project 2: Detection")

# Data
if (ROOT / 'data' / 'merged_dataset').exists():
    shutil.move(str(ROOT / 'data' / 'merged_dataset'), 
                str(ROOT / '02_detection' / 'data' / 'merged_dataset'))
    print("    ✓ merged_dataset")

# Scripts
if (ROOT / 'analyze_behavior_dataset.py').exists():
    shutil.move(str(ROOT / 'analyze_behavior_dataset.py'), 
                str(ROOT / '02_detection' / 'scripts' / 'analyze_behavior_dataset.py'))
    print("    ✓ analyze_behavior_dataset.py")

# Models
if (ROOT / 'yolo11n.pt').exists():
    shutil.move(str(ROOT / 'yolo11n.pt'), 
                str(ROOT / '02_detection' / 'models' / 'yolo11n.pt'))
    print("    ✓ yolo11n.pt")

# Reports
for md in ROOT.glob('*.md'):
    if 'MERGE' in md.name or 'DATASET' in md.name or 'CLEANUP' in md.name:
        shutil.move(str(md), str(ROOT / '02_detection' / md.name))
        print(f"    ✓ {md.name}")

# === ARCHIVE ===
print("\n  → Archive (datasets gốc)")

if (ROOT / 'data' / 'data_chicken_behavior').exists():
    shutil.move(str(ROOT / 'data' / 'data_chicken_behavior'), 
                str(ROOT / 'archive' / 'data_chicken_behavior'))
    print("    ✓ data_chicken_behavior")

if (ROOT / 'data' / 'data_chicken_behavior_2').exists():
    shutil.move(str(ROOT / 'data' / 'data_chicken_behavior_2'), 
                str(ROOT / 'archive' / 'data_chicken_behavior_2'))
    print("    ✓ data_chicken_behavior_2")

# Xóa thư mục data rỗng
if (ROOT / 'data').exists() and not list((ROOT / 'data').iterdir()):
    (ROOT / 'data').rmdir()
    print("    ✓ Xóa thư mục data rỗng")

if (ROOT / 'runs').exists() and not list((ROOT / 'runs').iterdir()):
    (ROOT / 'runs').rmdir()
    print("    ✓ Xóa thư mục runs rỗng")

# Tạo README cho mỗi project
print("\n3. Tạo README cho mỗi project...")

# README Classification
readme_cls = """# PROJECT 1: CHICKEN DISEASE CLASSIFICATION

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
"""

with open(ROOT / '01_classification' / 'README.md', 'w', encoding='utf-8') as f:
    f.write(readme_cls)
print("  ✓ 01_classification/README.md")

# README Detection
readme_det = """# PROJECT 2: CHICKEN DETECTION (HEALTHY vs SICK)

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
"""

with open(ROOT / '02_detection' / 'README.md', 'w', encoding='utf-8') as f:
    f.write(readme_det)
print("  ✓ 02_detection/README.md")

# README Archive
readme_archive = """# ARCHIVE

Thư mục lưu trữ các datasets gốc đã được merge vào project detection.

## Nội dung
- `data_chicken_behavior/` - Dataset gốc (382 ảnh)
- `data_chicken_behavior_2/` - Dataset Roboflow (2,793 ảnh)

## Lưu ý
Các datasets này đã được merge vào `02_detection/data/merged_dataset/`
Giữ lại để backup, không nên xóa.
"""

with open(ROOT / 'archive' / 'README.md', 'w', encoding='utf-8') as f:
    f.write(readme_archive)
print("  ✓ archive/README.md")

# Main README
readme_main = """# CHICKEN AI PROJECTS

Dự án AI phát hiện và phân loại bệnh gà.

## Cấu trúc

```
train_chicken/
├── 01_classification/     # Project 1: Phân loại bệnh (4 classes)
├── 02_detection/          # Project 2: Phát hiện gà bệnh (2 classes)
├── archive/               # Datasets backup
└── requirements.txt
```

## Projects

### 1. Classification (✅ Hoàn thành)
- **Mục đích:** Phân loại bệnh gà từ ảnh phân
- **Classes:** 4 (Coccidiosis, Salmonella, NCD, Healthy)
- **Dataset:** 8,069 ảnh
- **Performance:** 97.27% accuracy
- **Xem:** `01_classification/README.md`

### 2. Detection (⏳ Chưa train)
- **Mục đích:** Phát hiện gà khỏe/bệnh trong ảnh toàn cảnh
- **Classes:** 2 (healthy, sick)
- **Dataset:** 3,175 ảnh (merged)
- **Status:** Sẵn sàng training
- **Xem:** `02_detection/README.md`

## Requirements
```bash
pip install -r requirements.txt
```

## Tác giả
Hoàng Vũ Đình
"""

with open(ROOT / 'README.md', 'w', encoding='utf-8') as f:
    f.write(readme_main)
print("  ✓ README.md (main)")

print("\n" + "="*80)
print("✅ TỔ CHỨC LẠI HOÀN TẤT!")
print("="*80)

print("\nCấu trúc mới:")
print("""
train_chicken/
├── 01_classification/          # Project Classification (HOÀN THÀNH)
│   ├── data/
│   │   ├── data_phan_chicken/  (8,069 ảnh)
│   │   └── yolo_dataset/
│   ├── notebooks/
│   │   ├── train_yolov8_cls.ipynb
│   │   └── explore_data_phan_chicken.ipynb
│   ├── scripts/
│   │   ├── visualize_data_phan_chicken.py
│   │   └── analyze_overfitting.py
│   ├── models/
│   │   └── yolov8n-cls.pt
│   ├── results/
│   │   ├── runs/
│   │   └── *.png (visualizations)
│   └── README.md
│
├── 02_detection/               # Project Detection (CHƯA TRAIN)
│   ├── data/
│   │   └── merged_dataset/     (3,175 ảnh)
│   ├── scripts/
│   │   └── analyze_behavior_dataset.py
│   ├── models/
│   │   └── yolo11n.pt
│   ├── MERGE_SUCCESS_REPORT.md
│   ├── DATASET_ANALYSIS_REPORT.md
│   └── README.md
│
├── archive/                    # Backup datasets
│   ├── data_chicken_behavior/  (382 ảnh)
│   ├── data_chicken_behavior_2/ (2,793 ảnh)
│   └── README.md
│
├── requirements.txt
└── README.md
""")

print("\nBước tiếp theo:")
print("  1. Kiểm tra cấu trúc mới")
print("  2. Đọc README.md của mỗi project")
print("  3. Bắt đầu train project Detection!")
