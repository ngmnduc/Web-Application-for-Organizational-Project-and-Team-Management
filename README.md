# Web Application for Organizational Project & Team Management

Ứng dụng quản lý dự án, thành viên và công việc nhóm — gồm **Frontend (React)** và **Backend (Node.js + Express + MongoDB)**.  
Dự án được chia module rõ ràng, dễ mở rộng và triển khai.  


---

## 🚀 Cài đặt & Chạy dự án sau khi clone

### 1️⃣ Clone project về máy

```bash
git clone https://github.com/<your-username>/Web-Application-for-Organizational-Project-and-Team-Management.git
cd Web-Application-for-Organizational-Project-and-Team-Management

```
### 2️⃣ Cài đặt dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:
```bash
cd ../frontend
npm install
```

### 3️⃣ Cấu hình biến môi trường

Tạo file .env trong thư mục backend/ dựa theo mẫu .env.example
```bash
PORT=5000
MONGO_URI=<your_mongodb_atlas_connection>
JWT_SECRET=<your_secret_key>
```

### 4️⃣ Chạy server
Backend (Node.js + Express):
```bash
cd backend
npm run dev
```
Frontend (React + Vite):
```bash
cd frontend
npm run dev
```
