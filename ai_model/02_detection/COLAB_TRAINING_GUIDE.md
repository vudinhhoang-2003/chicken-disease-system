# 🚀 HƯỚNG DẪN TRAIN TRÊN GOOGLE COLAB

## ✅ ĐÃ TẠO XONG NOTEBOOK!

**File:** `02_detection/train_detection_colab.ipynb`

---

## 📋 CÁC BƯỚC THỰC HIỆN

### **BƯỚC 1: NÉN DATASET (Trên máy local)**

Mở PowerShell và chạy lệnh:

```powershell
# Di chuyển vào thư mục project
cd d:\train_chicken

# Nén dataset
Compress-Archive -Path "02_detection\data\merged_dataset" -DestinationPath "merged_dataset.zip" -Force

# Kiểm tra kích thước
(Get-Item "merged_dataset.zip").Length / 1MB
```

**Kết quả:** File `merged_dataset.zip` (~500-800 MB)

---

### **BƯỚC 2: UPLOAD LÊN GOOGLE DRIVE**

1. **Mở Google Drive:** https://drive.google.com
2. **Tạo thư mục mới:** `chicken_detection`
3. **Upload file:** Kéo thả `merged_dataset.zip` vào thư mục `chicken_detection`
4. **Chờ upload xong** (~5-10 phút tùy tốc độ mạng)

---

### **BƯỚC 3: MỞ COLAB VÀ UPLOAD NOTEBOOK**

1. **Mở Google Colab:** https://colab.research.google.com
2. **Click "File" → "Upload notebook"**
3. **Chọn file:** `d:\train_chicken\02_detection\train_detection_colab.ipynb`
4. **Notebook sẽ mở trong Colab**

---

### **BƯỚC 4: BẬT GPU**

1. **Click "Runtime" → "Change runtime type"**
2. **Hardware accelerator:** Chọn **"T4 GPU"** (hoặc "GPU" nếu không thấy T4)
3. **Click "Save"**

---

### **BƯỚC 5: CHẠY NOTEBOOK**

**Chạy từng cell theo thứ tự:**

1. **Cell 1:** Cài đặt Ultralytics
   - Chờ ~30 giây
   - Kiểm tra GPU có được detect không

2. **Cell 2:** Mount Google Drive
   - Click "Connect to Google Drive"
   - Cho phép quyền truy cập
   - Kiểm tra file `merged_dataset.zip` có tồn tại không

3. **Cell 3:** Giải nén dataset
   - Chờ ~2-3 phút
   - Kiểm tra số lượng ảnh (2,781 train + 277 valid + 117 test)

4. **Cell 4:** Cập nhật data.yaml
   - Chạy nhanh (~1 giây)

5. **Cell 5:** Load pretrained model
   - Chờ ~10 giây

6. **Cell 6:** **TRAINING** ⏰
   - **Thời gian:** ~2-3 giờ
   - **Theo dõi:** Xem progress bar và metrics
   - **Có thể tắt máy:** Training vẫn chạy trên Colab

7. **Cell 7-10:** Đánh giá và lưu kết quả
   - Chạy sau khi training xong

---

### **BƯỚC 6: THEO DÕI TRAINING**

Trong quá trình training, bạn sẽ thấy:

```
Epoch   GPU_mem   box_loss   cls_loss   dfl_loss   Instances   Size
  1/100     2.5G      1.234      0.567      0.890        123    640
  2/100     2.5G      1.123      0.456      0.789        123    640
  ...
```

**Metrics quan trọng:**
- `box_loss`, `cls_loss`, `dfl_loss`: Giảm dần là tốt
- `mAP@50`: Tăng dần (mục tiêu: >0.85)
- `Precision`, `Recall`: Tăng dần

---

### **BƯỚC 7: SAU KHI TRAINING XONG**

1. **Xem kết quả:**
   - Chạy cell 7 để xem training curves
   - Chạy cell 8 để test inference

2. **Download model về:**
   - Model đã tự động lưu vào Google Drive
   - Vào `chicken_detection/trained_models/`
   - Download file `chicken_detection_best.pt`

3. **Lưu vào máy local:**
   - Copy vào: `d:\train_chicken\02_detection\models\`
   - Đổi tên: `chicken_detection_best.pt`

---

## 📊 KỲ VỌNG KẾT QUẢ

### **Performance dự kiến:**
- **mAP@50:** 85-90%
- **mAP@50:0.95:** 70-80%
- **Precision:** 85-90%
- **Recall:** 85-90%

### **So với baseline (382 ảnh):**
- **Cải thiện:** +10-15% mAP
- **Ít overfitting hơn**
- **Tổng quát hóa tốt hơn**

---

## ⚠️ LƯU Ý

1. **Colab Free có giới hạn:**
   - Tối đa 12 giờ/session
   - Training ~2-3 giờ nên OK
   - Nếu bị disconnect, chạy lại từ cell training

2. **Kiểm tra GPU:**
   - Phải thấy "Tesla T4" hoặc GPU khác
   - Nếu không có GPU, training sẽ RẤT CHẬM

3. **Backup kết quả:**
   - Model tự động lưu vào Google Drive
   - Download về ngay sau khi xong

---

## 🎯 BƯỚC TIẾP THEO (SAU KHI TRAIN XONG)

1. **Download model về máy**
2. **Test inference trên ảnh mới**
3. **So sánh với baseline (382 ảnh)**
4. **Deploy model (nếu muốn)**

---

**Sẵn sàng bắt đầu! Chúc bạn train thành công!** 🚀
