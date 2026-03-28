# HVNH Exam System (Hệ thống Khảo thí HVNH)

Hệ thống quản lý thi và hỗ trợ học tập thông minh dành cho Học viện Ngân hàng. Dự án bao gồm Backend (Spring Boot) và Frontend (React Vite + TypeScript), tích hợp trí tuệ nhân tạo (AI) để hỗ trợ sinh viên.

---

## 🚀 Tính năng chính (Key Features)

### 👨‍🎓 Dành cho Sinh viên (Student Portal)
- **Study Hub AI**: Tích hợp AI (Gemini/Groq) hỗ trợ giải đáp thắc mắc và tóm tắt kiến thức.
- **Quản lý học tập**: Theo dõi môn học, lộ trình học và ngân hàng câu hỏi cá nhân.
- **Trình dựng công thức**: Hỗ trợ xây dựng công thức toán học/kinh tế phức tạp.
- **Làm bài thi**: Tham gia các kỳ thi trực tuyến với giao diện trực quan, ổn định.

### 👨‍🏫 Dành cho Giảng viên & Quản trị (Teacher & Admin)
- **Quản lý ngân hàng câu hỏi**: Nhập liệu câu hỏi từ file Word/PDF (Sử dụng Apache POI & PDFBox).
- **Giám sát phòng thi**: Theo dõi trạng thái làm bài của sinh viên theo thời gian thực.
- **Dashboard Admin**: Quản lý khoa, bộ môn, giảng viên và sinh viên toàn hệ thống.
- **Thống kê**: Biểu đồ phân tích dữ liệu kỳ thi và hiệu suất học tập.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

### Backend
- **Framework**: Spring Boot 3.2.1 (Java 17)
- **Security**: Spring Security + JJWT (JSON Web Token)
- **Database**: 
  - **PostgreSQL (Supabase)**: Lưu trữ dữ liệu hệ thống chính.
  - **MongoDB**: Lưu trữ logs và các dữ liệu không cấu trúc.
- **AI Integration**: Gemini API / Groq Cloud API.
- **Document Processing**: Apache POI (Word), Apache PDFBox (PDF).
- **API Documentation**: Swagger / OpenAPI 3.0.

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **State Management**: React Context API & Hooks.
- **Auth**: Supabase Auth Integration.
- **Styling**: TailwindCSS & Lucide Icons.

---

## 📦 Cài đặt (Installation)

### 1. Yêu cầu hệ thống
- Java 17+
- Node.js 18+
- Maven 3.8+
- Database: PostgreSQL & MongoDB (Cloud hoặc Local)

### 2. Cấu hình Backend
Di chuyển vào thư mục `backend/src/main/resources`, tạo hoặc chỉnh sửa file `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://your-db-url
    username: your-username
    password: your-password
  data:
    mongodb:
      uri: mongodb+srv://your-mongo-uri

supabase:
  url: your-supabase-url
  key:
    service-role-key: your-service-key
  jwt:
    secret: your-jwt-secret

gemini:
  api:
    key: your-ai-api-key
```

### 3. Cấu hình Frontend
Di chuyển vào thư mục `frontend`, tạo file `.env`:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8080/api
```

### 4. Chạy ứng dụng
#### Backend:
```bash
cd backend
mvn spring-boot:run
```
#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Cấu trúc thư mục (Project Structure)

```text
hvnh-exam-system/
├── backend/               # Spring Boot project
│   ├── src/main/java/     # Source code (Controller, Service, Entity...)
│   └── src/main/resources/# Config & Static assets
├── frontend/              # React project
│   ├── src/modules/       # Các module chức năng (Admin, Teacher, Student...)
│   ├── src/components/    # UI Components dùng chung
│   └── src/services/      # API calls & Integration
├── docs/                  # Tài liệu hướng dẫn & thiết kế
└── docker-compose.yml     # Cấu hình triển khai Docker (nếu có)
```

---

## 🛡 Bảo mật & License
- Dự án sử dụng JWT để xác thực và phân quyền (RBAC).
- Các API key quan trọng được quản lý qua biến môi trường.

**HVNH Exam System Team - 2026**
