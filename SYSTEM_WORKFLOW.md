# SYSTEM WORKFLOW & ARCHITECTURE
**Project:** Chicken Disease Diagnosis System  
**Last Updated:** 04/02/2026

## 1. Tổng quan hệ thống
Hệ thống hỗ trợ người chăn nuôi phát hiện bệnh gà sớm qua hình ảnh/video, cung cấp phác đồ điều trị chuẩn xác từ bác sĩ thú y, và hỗ trợ hỏi đáp qua AI Chatbot.

### Các thành phần chính:
1.  **Mobile App (Client):** Dành cho người nông dân (**React Native CLI** - TypeScript).
2.  **Web Admin (Management):** Dành cho Admin/Bác sĩ thú y (React Vite + MUI).
3.  **Backend Core:** API Server (FastAPI + PostgreSQL).
4.  **AI Services:**
    *   **YOLOv8:** Nhận diện và phân loại bệnh.
    *   **RAG System:** ChromaDB + Gemini/Groq (Hỏi đáp thông minh).

---

## 2. Luồng Nghiệp vụ Chính (Business Workflows)

### Luồng A: Giám sát & Cảnh báo (Flock Monitoring)
*Mục tiêu: Phát hiện bất thường trong đàn gà qua camera/video.*
1.  **Input:** Người dùng quay video hoặc chụp ảnh toàn cảnh đàn gà.
2.  **Process (YOLO Detection):** 
    *   Sử dụng model: `backend/model_store/detection_best.pt`.
    *   AI quét khung hình, đếm số gà và phân loại: `healthy` vs. `sick`.
3.  **Output:** 
    *   Báo cáo số lượng gà bất thường.
    *   **Cảnh báo:** Hiển thị Alert trên Mobile nếu phát hiện gà có dấu hiệu bệnh.

### Luồng B: Chẩn đoán bệnh chi tiết (Disease Diagnosis)
*Mục tiêu: Xác định chính xác tên bệnh và đưa ra phác đồ điều trị.*
1.  **Input:** Người dùng chụp ảnh cận cảnh phân gà hoặc bộ phận bị bệnh.
2.  **Process 1 (Classification):** 
    *   Sử dụng model: `backend/model_store/classification_best.pt`.
    *   YOLO Classify trả về `Disease_ID` (VD: Coccidiosis, Salmonella).
3.  **Process 2 (Treatment Retrieval):** 
    *   Hệ thống dùng `Disease_ID` truy vấn trực tiếp **PostgreSQL**.
    *   Lấy thông tin Thuốc, Liều lượng từ bảng `diseases` và `treatment_steps`.
4.  **Output:** Hiển thị tên bệnh + Quy trình điều trị chi tiết (đảm bảo độ chính xác y khoa).

### Luồng C: Hỏi đáp chuyên sâu (AI Chatbot & RAG)
*Mục tiêu: Giải đáp thắc mắc mở rộng (VD: "Cách vệ sinh chuồng trại?").*
1.  **Input:** Người dùng nhập câu hỏi văn bản.
2.  **Retrieval:** Tìm kiếm ngữ cảnh trong **ChromaDB** (Vector Database).
3.  **Generation:** Sử dụng Groq (Llama 3) hoặc Gemini để tổng hợp câu trả lời dựa trên ngữ cảnh tìm được.
4.  **Output:** Câu trả lời tư vấn kèm nguồn tham khảo từ Knowledge Base.

---

## 3. Kiến trúc Dữ liệu & AI Models
*   **Database:** PostgreSQL (Nguồn dữ liệu chính) và ChromaDB (Dữ liệu vector cho RAG).
*   **Model Store:** Tọa lạc tại `backend/model_store/`.
    *   `detection_best.pt`: Model YOLOv8n (Detection).
    *   `classification_best.pt`: Model YOLOv8n-cls (Classification).
*   **Sync:** Tự động đồng bộ từ PostgreSQL sang ChromaDB khi Admin cập nhật kiến thức bệnh.

---

## 4. Quản lý Người dùng & Bảo mật
*   **Auth:** JWT Authentication.
*   **Roles:** 
    *   `admin`: Quản lý toàn bộ hệ thống qua Web.
    *   `farmer`: Sử dụng các tính năng chẩn đoán qua Mobile.
*   **API Client:** Mobile App kết nối qua `axios` với cấu hình `interceptors` để đính kèm Token tự động.

---

## 5. Trạng thái hiện tại (04/02/2026)
*   [x] **Backend:** Hoàn thiện 100% Core API, Auth, YOLO Service và RAG Sync.
*   [x] **Web Admin:** Hoàn thiện 100% các trang Quản lý (User, Disease, Logs, Settings).
*   [x] **Mobile App:** Hoàn thiện khung xương (Skeleton) và các màn hình chính. Đã kết nối API thành công.
*   [x] **AI Models:** Đã train và deploy model Detection & Classification vào model_store.
