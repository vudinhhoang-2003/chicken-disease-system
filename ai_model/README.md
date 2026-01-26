# CHICKEN AI PROJECTS

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
