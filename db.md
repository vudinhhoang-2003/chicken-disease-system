# 🗄️ Tài Liệu Cơ Sở Dữ Liệu — Chicken Disease System

## 1. Tổng Quan Hệ Thống Database

Dự án sử dụng **2 cơ sở dữ liệu** chạy song song, mỗi loại phục vụ mục đích khác nhau:

| Thành phần | Công nghệ | Port | Vai trò |
|:---|:---|:---|:---|
| **Relational DB** | PostgreSQL 15 | `5432` | Lưu dữ liệu nghiệp vụ chính (users, logs, bệnh học...) |
| **Vector DB** | ChromaDB 0.5.3 | `8001` | Lưu embedding văn bản cho hệ thống RAG/AI Chat |
| **ORM** | SQLAlchemy 2.x | — | Kết nối Python ↔ PostgreSQL |
| **Migration** | Alembic | — | Quản lý lịch sử thay đổi schema |

**Connection string mặc định:**
```
postgresql://admin:admin123@postgres:5432/chicken_disease
```

---

## 2. Sơ Đồ Quan Hệ (ERD)

```
users (1) ──────< flocks (N)
users (1) ──────< detection_logs (N)
users (1) ──────< diagnosis_logs (N)
users (1) ──────< chat_sessions (N)
users (1) ──────< usage_logs (N)

flocks (1) ─────< detection_logs (N)
flocks (1) ─────< diagnosis_logs (N)

chat_sessions (1) ──< chat_messages (N)

diseases (1) ────< treatment_steps (N)
treatment_steps (1) < medicines (N)
```

---

## 3. Chi Tiết Từng Bảng

### 3.1. `users` — Người dùng

Bảng lưu trữ tài khoản của tất cả loại người dùng trong hệ thống.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh duy nhất |
| `full_name` | `VARCHAR` | INDEX | Họ và tên đầy đủ |
| `email` | `VARCHAR` | UNIQUE, INDEX | Email đăng nhập (tùy chọn) |
| `phone` | `VARCHAR` | INDEX | Số điện thoại (bắt buộc khi đăng ký qua mobile) |
| `hashed_password` | `VARCHAR` | NOT NULL | Mật khẩu đã mã hóa (bcrypt) |
| `role` | `VARCHAR` | DEFAULT `farmer` | Phân quyền: `farmer`, `vet`, `admin` |
| `is_active` | `BOOLEAN` | DEFAULT `true` | Trạng thái hoạt động của tài khoản |
| `is_superuser` | `BOOLEAN` | DEFAULT `false` | Quyền Super Admin (truy cập Web Admin) |
| `created_at` | `TIMESTAMPTZ` | SERVER_DEFAULT `now()` | Thời điểm tạo tài khoản |

**Dữ liệu mẫu (Seed):**
```
email: admin@gmail.com | password: admin123 | role: admin | is_superuser: true
```

---

### 3.2. `flocks` — Đàn Gà

Bảng quản lý thông tin các đàn gà/chuồng trại của từng người dùng.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh duy nhất |
| `user_id` | `INTEGER` | FK → `users.id` | Chủ sở hữu đàn gà |
| `name` | `VARCHAR` | | Tên chuồng. VD: "Chuồng số 1" |
| `type` | `VARCHAR` | | Loại gà. VD: "Gà thịt", "Gà đẻ" |
| `total_quantity` | `INTEGER` | | Số lượng gà ban đầu trong đàn |
| `start_date` | `DATETIME` | | Ngày bắt đầu nuôi lứa này |
| `is_active` | `BOOLEAN` | DEFAULT `true` | Đàn đang hoạt động hay đã thanh lý |

---

### 3.3. `detection_logs` — Nhật Ký Giám Sát Đàn

Lưu kết quả từ **YOLOv8 Detection** (nhận diện gà khỏe/bệnh qua ảnh hoặc video).

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh duy nhất |
| `user_id` | `INTEGER` | FK → `users.id` | Người đã thực hiện quét |
| `flock_id` | `INTEGER` | FK → `flocks.id`, NULLABLE | Đàn gà liên quan (tùy chọn) |
| `image_path` | `VARCHAR` | | Đường dẫn ảnh gốc trên server. VD: `detections/uuid_orig.jpg` |
| `annotated_image_path` | `VARCHAR` | | Đường dẫn ảnh đã vẽ bounding box |
| `total_chickens` | `INTEGER` | | Tổng số gà phát hiện trong khung hình |
| `healthy_count` | `INTEGER` | | Số gà khỏe mạnh |
| `sick_count` | `INTEGER` | | Số gà có dấu hiệu bất thường/bệnh |
| `raw_result` | `JSON` | NULLABLE | Mảng chi tiết bounding boxes: `[{id, class, confidence, bbox:[x1,y1,x2,y2]}]` |
| `created_at` | `TIMESTAMPTZ` | SERVER_DEFAULT `now()` | Thời điểm phân tích |

**Ví dụ `raw_result`:**
```json
[
  {"id": 1, "class": "healthy_chicken", "confidence": 0.92, "bbox": [120.5, 80.3, 250.1, 200.6]},
  {"id": 2, "class": "sick_chicken", "confidence": 0.87, "bbox": [300.0, 100.0, 420.0, 230.0]}
]
```

---

### 3.4. `diagnosis_logs` — Nhật Ký Chẩn Đoán Bệnh

Lưu kết quả từ **YOLOv8 Classification** (phân loại bệnh qua ảnh phân gà).

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh duy nhất |
| `user_id` | `INTEGER` | FK → `users.id` | Người đã thực hiện chẩn đoán |
| `flock_id` | `INTEGER` | FK → `flocks.id`, NULLABLE | Đàn gà liên quan (tùy chọn) |
| `image_path` | `VARCHAR` | | Đường dẫn ảnh phân gốc lưu trên server |
| `predicted_disease` | `VARCHAR` | | Kết quả AI: `Healthy`, `Coccidiosis`, `New Castle Disease`, `Salmonella` |
| `confidence` | `FLOAT` | | Độ tin cậy của dự đoán (0.0 → 1.0) |
| `all_probabilities` | `JSON` | NULLABLE | Xác suất của tất cả 4 lớp bệnh |
| `verified_result` | `VARCHAR` | NULLABLE | Kết quả xác nhận lại bởi bác sĩ thú y |
| `is_correct` | `BOOLEAN` | NULLABLE | AI có đoán đúng không? (dùng để retrain) |
| `created_at` | `TIMESTAMPTZ` | SERVER_DEFAULT `now()` | Thời điểm chẩn đoán |

**Ví dụ `all_probabilities`:**
```json
{
  "Coccidiosis": 0.8812,
  "Healthy": 0.0421,
  "New Castle Disease": 0.0512,
  "Salmonella": 0.0255
}
```

---

### 3.5. `chat_sessions` — Phiên Chat AI

Phiên hội thoại tư vấn với AI. Mỗi phiên chứa nhiều tin nhắn.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh phiên chat |
| `user_id` | `INTEGER` | FK → `users.id` | Chủ sở hữu phiên chat |
| `title` | `VARCHAR` | | Tiêu đề phiên (VD: tóm tắt câu hỏi đầu tiên) |
| `created_at` | `TIMESTAMPTZ` | SERVER_DEFAULT `now()` | Thời điểm bắt đầu |
| `updated_at` | `TIMESTAMPTZ` | ON UPDATE `now()` | Lần nhắn tin cuối cùng |

---

### 3.6. `chat_messages` — Tin Nhắn Chat

Lưu từng tin nhắn trong một phiên chat.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh tin nhắn |
| `session_id` | `INTEGER` | FK → `chat_sessions.id` | Phiên chat cha |
| `role` | `VARCHAR` | | Người gửi: `user` (người dùng) hoặc `ai` (trợ lý AI) |
| `content` | `TEXT` | | Nội dung tin nhắn |
| `created_at` | `TIMESTAMPTZ` | SERVER_DEFAULT `now()` | Thời điểm gửi |

---

### 3.7. `diseases` — Cơ Sở Kiến Thức Bệnh

Bảng trung tâm lưu thông tin y khoa về các bệnh gà. Dữ liệu từ đây được đồng bộ sang ChromaDB để phục vụ RAG.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh |
| `code` | `VARCHAR` | UNIQUE, INDEX | Mã bệnh. VD: `DIS_01` |
| `name_vi` | `VARCHAR` | INDEX | Tên tiếng Việt. VD: "Bệnh Cầu trùng" |
| `name_en` | `VARCHAR` | | Tên tiếng Anh (khớp với nhãn YOLO). VD: "Coccidiosis" |
| `symptoms` | `TEXT` | | Mô tả triệu chứng nhận biết |
| `cause` | `TEXT` | | Nguyên nhân gây bệnh |
| `prevention` | `TEXT` | | Các biện pháp phòng bệnh |
| `source` | `VARCHAR` | NULLABLE | Nguồn tài liệu tham khảo |
| `sync_status` | `VARCHAR` | DEFAULT `PENDING` | Trạng thái đồng bộ với ChromaDB: `PENDING`, `SUCCESS`, `ERROR` |
| `sync_error` | `TEXT` | NULLABLE | Thông tin lỗi nếu sync thất bại |

> **Trigger tự động:** Khi Admin gọi API `POST/PUT/DELETE /admin/diseases`, hệ thống tự động chạy background task để đồng bộ dữ liệu sang ChromaDB.

**Dữ liệu mẫu (4 bệnh được seed từ file JSON):**
| `code` | `name_en` | `name_vi` |
|:---|:---|:---|
| `DIS_01` | `Coccidiosis` | Bệnh Cầu Trùng |
| `DIS_02` | `Healthy` | Khỏe Mạnh |
| `DIS_03` | `New Castle Disease` | Bệnh Newcastle (Gà Rù) |
| `DIS_04` | `Salmonella` | Bệnh Thương Hàn |

---

### 3.8. `treatment_steps` — Phác Đồ Điều Trị

Mỗi bệnh có nhiều bước điều trị được sắp xếp theo thứ tự.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh |
| `disease_id` | `INTEGER` | FK → `diseases.id` | Bệnh cha (xóa bệnh → cascade xóa bước) |
| `step_order` | `INTEGER` | | Thứ tự bước. VD: 1, 2, 3... |
| `description` | `TEXT` | | Mô tả chi tiết việc cần làm ở bước này |
| `action` | `VARCHAR` | NULLABLE | Hành động cụ thể (khi không dùng thuốc). VD: "Cách ly ngay" |

---

### 3.9. `medicines` — Thuốc Gợi Ý

Mỗi bước điều trị có thể gợi ý 1 hoặc nhiều loại thuốc.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh |
| `step_id` | `INTEGER` | FK → `treatment_steps.id` | Bước điều trị cha |
| `name` | `VARCHAR` | | Tên thuốc thương mại |
| `active_ingredient` | `VARCHAR` | NULLABLE | Hoạt chất chính. VD: "Amprolium" |
| `manufacturer` | `VARCHAR` | NULLABLE | Nhà sản xuất |
| `dosage` | `VARCHAR` | | Liều dùng và cách dùng |
| `reference_source` | `VARCHAR` | NULLABLE | Nguồn tham khảo về liều lượng |

**Quan hệ phân cấp:**
```
Disease (1 bệnh)
  └── TreatmentStep (Bước 1: Cách ly)
        └── Medicine (Thuốc A)
        └── Medicine (Thuốc B)
  └── TreatmentStep (Bước 2: Điều trị)
        └── Medicine (Thuốc C)
```

---

### 3.10. `general_knowledge` — Kiến Thức Chăn Nuôi Chung

Bài viết kiến thức tổng quát (chuồng trại, dinh dưỡng, vệ sinh...) do Admin thêm vào. Cũng được đồng bộ sang ChromaDB.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh |
| `category` | `VARCHAR` | INDEX | Danh mục. VD: "Chuồng trại", "Dinh dưỡng", "Vệ sinh" |
| `title` | `VARCHAR` | INDEX | Tiêu đề bài viết |
| `content` | `TEXT` | | Nội dung đầy đủ |
| `source` | `VARCHAR` | NULLABLE | Nguồn tài liệu |
| `sync_status` | `VARCHAR` | DEFAULT `PENDING` | `PENDING`, `SUCCESS`, `ERROR` |
| `created_at` | `TIMESTAMPTZ` | SERVER_DEFAULT `now()` | Ngày tạo |
| `updated_at` | `TIMESTAMPTZ` | ON UPDATE `now()` | Ngày cập nhật gần nhất |

---

### 3.11. `settings` — Cấu Hình Hệ Thống

Lưu trữ các cấu hình AI dạng key-value. Admin quản lý qua Web Admin.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh |
| `key` | `VARCHAR` | UNIQUE, INDEX | Tên cấu hình |
| `value` | `TEXT` | | Giá trị (API Key được lưu dạng bản rõ nhưng che khi trả về) |
| `description` | `VARCHAR` | NULLABLE | Mô tả ngắn |
| `updated_at` | `TIMESTAMPTZ` | SERVER_DEFAULT/ON UPDATE `now()` | Thời điểm cập nhật |

**Các key quan trọng:**
| `key` | Mô tả |
|:---|:---|
| `ai_provider` | Nhà cung cấp AI đang dùng: `gemini` hoặc `groq` |
| `ai_model` | Tên model AI |
| `ai_gemini_key` | Google Gemini API Key (**write-only**, luôn trả về `********`) |
| `ai_groq_key` | Groq API Key (**write-only**, luôn trả về `********`) |
| `ai_temperature` | Nhiệt độ sinh văn bản (0.0 → 1.0) |
| `ai_system_prompt` | System Prompt tùy chỉnh cho AI Chat |

---

### 3.12. `usage_logs` — Nhật Ký Sử Dụng AI

Ghi lại mỗi lần hệ thống gọi AI. Dùng để tính chi phí và thống kê trên Dashboard.

| Cột | Kiểu | Ràng buộc | Mô tả |
|:---|:---|:---|:---|
| `id` | `INTEGER` | PK, AUTO | Định danh |
| `user_id` | `INTEGER` | FK → `users.id`, NULLABLE | Người dùng (nullable nếu trigger từ hệ thống) |
| `feature` | `VARCHAR` | | Tính năng đã dùng: `chat`, `classification`, `detection`, `video_detection` |
| `provider` | `VARCHAR` | | Nhà cung cấp: `gemini`, `groq`, `yolo` |
| `model` | `VARCHAR` | | Model cụ thể: `gemini-1.5-flash`, `yolov8n-cls`... |
| `tokens_prompt` | `INTEGER` | DEFAULT 0 | Số token trong prompt (input) |
| `tokens_completion` | `INTEGER` | DEFAULT 0 | Số token trong response (output) |
| `total_tokens` | `INTEGER` | DEFAULT 0 | Tổng token đã tiêu thụ |
| `cost_est` | `FLOAT` | DEFAULT 0.0 | Chi phí ước tính (USD) |
| `created_at` | `TIMESTAMPTZ` | SERVER_DEFAULT `now()` | Thời điểm gọi AI |

---

## 4. ChromaDB — Vector Database

ChromaDB không dùng SQL mà lưu trữ dạng **embedding vectors** phục vụ tìm kiếm ngữ nghĩa.

| Collection | Nội dung | Nguồn |
|:---|:---|:---|
| `disease_knowledge` | Vector từ nội dung bảng `diseases` (triệu chứng, nguyên nhân, phác đồ) | Sync từ PostgreSQL |
| `general_knowledge` | Vector từ bảng `general_knowledge` | Sync từ PostgreSQL |

**Embedding model sử dụng:**
```
sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
(chạy local, không cần API Key, hỗ trợ đa ngôn ngữ)
Vector size: 384 chiều
```

**Luồng đồng bộ:**
```
Admin thêm/sửa/xóa bệnh (PostgreSQL)
        ↓
Background Task tự động kích hoạt
        ↓
ChromaDB cập nhật vector embedding
        ↓
RAG Chat sẽ dùng vector mới ngay lập tức
```

---

## 5. Migration (Alembic)

Dự án dùng **Alembic** để quản lý phiên bản schema.

| Revision ID | Ngày tạo | Mô tả |
|:---|:---|:---|
| `078456a8b9d3` | 2026-02-04 | Initial migration — Tạo toàn bộ 12 bảng |

**Lệnh Alembic thường dùng:**
```bash
# Chạy migration mới nhất
alembic upgrade head

# Xem lịch sử
alembic history

# Tạo file migration mới (khi sửa models.py)
alembic revision --autogenerate -m "ten_thay_doi"

# Rollback 1 bước
alembic downgrade -1
```

---

## 6. Seed Data

Hệ thống tự động khởi tạo dữ liệu mẫu khi ứng dụng khởi động lần đầu (trong `app/core/seed.py`).

### Dữ liệu được seed tự động:
1. **Tài khoản Admin mặc định:**
   - Email: `admin@gmail.com`
   - Password: `admin123`
   - Role: `admin`, `is_superuser: true`

2. **Knowledge Base (4 bệnh gà với phác đồ đầy đủ)** — đọc từ file:
   ```
   backend/knowledge_base/raw_data/knowlege_base.json
   ```
   Mỗi bệnh bao gồm: thông tin cơ bản → các bước điều trị → thuốc gợi ý cho từng bước.

### Logic seed an toàn:
- Kiểm tra trước khi tạo (`if not exists`) → Chạy nhiều lần không bị trùng dữ liệu.

---

## 7. Sơ Đồ Luồng Dữ Liệu

```
📸 User chụp ảnh phân
        ↓
Backend: YOLO classify → predicted_disease = "Coccidiosis"
        ↓
DiagnosisLog INSERT vào PostgreSQL (image_path, predicted_disease, confidence)
        ↓
Query diseases WHERE name_en ILIKE 'Coccidiosis'
        ↓
Trả về: disease + treatment_steps + medicines → Mobile App

💬 User gõ câu hỏi chat
        ↓
Embedding câu hỏi → Vector 384D
        ↓
ChromaDB KNN Search → Top-K tài liệu liên quan
        ↓
Prompt = System + Context từ ChromaDB + Câu hỏi
        ↓
LLM (Gemini/Groq) sinh câu trả lời
        ↓
UsageLog INSERT vào PostgreSQL (tokens, cost_est)
```

---

*Cập nhật lần cuối: 28/02/2026*
