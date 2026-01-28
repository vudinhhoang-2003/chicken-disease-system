# SYSTEM WORKFLOW & ARCHITECTURE
**Project:** Chicken Disease Diagnosis System  
**Last Updated:** 28/01/2026

## 1. Tổng quan hệ thống
Hệ thống hỗ trợ người chăn nuôi phát hiện bệnh gà sớm qua hình ảnh/video, cung cấp phác đồ điều trị chuẩn xác từ bác sĩ thú y, và hỗ trợ hỏi đáp qua AI Chatbot.

### Các thành phần chính:
1.  **Mobile App (Client):** Dành cho người nông dân (React Native Expo).
2.  **Web Admin (Management):** Dành cho Admin/Bác sĩ thú y (React Vite).
3.  **Backend Core:** API Server (FastAPI + PostgreSQL).
4.  **AI Services:**
    *   **YOLOv8:** Nhận diện và phân loại bệnh.
    *   **RAG System:** ChromaDB + Gemini/LLM (Hỏi đáp thông minh).

---

## 2. Luồng Nghiệp vụ Chính (Business Workflows)

### Luồng A: Giám sát & Cảnh báo (Flock Monitoring)
*Mục tiêu: Phát hiện bất thường trong đàn gà qua camera/video.*
1.  **Input:** Người dùng quay video hoặc chụp ảnh toàn cảnh đàn gà.
2.  **Process (YOLO Detection):** 
    *   AI quét toàn bộ khung hình.
    *   Đếm tổng số gà.
    *   Phân loại trạng thái: Khỏe mạnh vs. Bệnh (Dựa trên hành vi: ủ rũ, xù lông, gục đầu).
3.  **Output:** 
    *   Báo cáo: "Phát hiện 5/50 con có dấu hiệu bất thường".
    *   **Cảnh báo:** Nếu tỷ lệ bệnh vượt ngưỡng -> Yêu cầu kiểm tra kỹ.

### Luồng B: Chẩn đoán bệnh chi tiết (Disease Diagnosis)
*Mục tiêu: Xác định chính xác tên bệnh và đưa ra thuốc.*
1.  **Input:** Người dùng chụp ảnh cận cảnh (Phân gà hoặc Gà bệnh).
2.  **Process 1 (Classification):** YOLO Classify phân tích ảnh -> Trả về `Disease_ID` (Ví dụ: Cầu trùng).
3.  **Process 2 (Treatment Retrieval):** 
    *   Hệ thống dùng `Disease_ID` truy vấn trực tiếp **PostgreSQL**.
    *   **Quan trọng:** Thông tin Thuốc, Liều lượng, Phác đồ được lấy từ Database cứng (Structured Data) để đảm bảo độ chính xác y tế 100% (Không dùng AI sinh văn bản ở bước này để tránh ảo giác).
4.  **Output:** Hiển thị tên bệnh + Quy trình điều trị từng bước cho người dùng.

### Luồng C: Hỏi đáp chuyên sâu (AI Chatbot & RAG)
*Mục tiêu: Giải đáp thắc mắc mở rộng (VD: "Cách phòng tránh?", "Gà ăn gì mau khỏe?").*
1.  **Input:** Người dùng chat câu hỏi.
2.  **Retrieval:** Hệ thống tìm kiếm ngữ cảnh liên quan trong **ChromaDB** (Vector Database).
3.  **Generation:** Gửi câu hỏi + Ngữ cảnh tìm được cho LLM (Gemini) để sinh câu trả lời tự nhiên.
4.  **Output:** Câu trả lời tư vấn kèm nguồn tài liệu.

---

## 3. Kiến trúc Dữ liệu Lai (Hybrid Data Architecture)
Để đảm bảo tính nhất quán (Consistency) giữa Chẩn đoán và Chatbot:

*   **Master Data:** PostgreSQL (Bảng `diseases`, `treatment_steps`, `medicines`). Đây là nguồn chân lý duy nhất.
*   **Sync Mechanism:** 
    *   Khi Admin Thêm/Sửa bệnh trên Web Admin -> Lưu vào PostgreSQL.
    *   Hệ thống **tự động trigger** hàm `rag_service.sync_disease()`.
    *   Dữ liệu được convert thành văn bản -> Embed -> Update vào **ChromaDB**.
*   **Lợi ích:** Chatbot luôn trả lời khớp với phác đồ điều trị chuẩn, không bị tình trạng "Ông nói gà, bà nói vịt".

---

## 4. Quản lý Người dùng (User Management)
*   **Admin:** Toàn quyền (Quản lý User, Quản lý Bệnh, Xem Logs).
*   **Farmer (Nông dân):** 
    *   Có thể dùng chế độ **Guest (Khách)** để test nhanh.
    *   Khuyến khích **Đăng ký** để lưu lịch sử chẩn đoán và đồng bộ dữ liệu.
*   **Auth:** Sử dụng JWT. Web Admin dùng `sessionStorage` (Tự đăng xuất khi tắt trình duyệt).

---

## 5. Trạng thái hiện tại (28/01/2026)
*   [x] **Backend:** Hoàn thiện API, Auth, YOLO, RAG Sync.
*   [x] **Database:** Đã cập nhật bảng User (`is_active`, `is_superuser`).
*   [x] **Web Admin:** 
    *   Dashboard thống kê.
    *   Quản lý bệnh (Knowledge Base).
    *   Lịch sử chẩn đoán (Diagnosis Logs).
    *   Quản lý người dùng (CRUD Users).
*   [ ] **Mobile App:** Chưa khởi tạo (Kế hoạch tiếp theo: React Native Expo).
