import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AppRouter = ({ children, requiredRole }) => {
  const location = useLocation();
  
  // 1. Lấy data an toàn (tránh crash nếu JSON lỗi)
  const { token, user } = useMemo(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    try {
      return { token, user: userStr ? JSON.parse(userStr) : null };
    } catch (e) {
      // Nếu JSON lỗi, coi như chưa login để bắt đăng nhập lại
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return { token: null, user: null };
    }
  }, []);

  // Log kiểm tra (chỉ hiện khi dev)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AppRouter] Check Path: ${location.pathname}`);
    console.log(` - User Role: '${user?.role}'`);
    console.log(` - Required:`, requiredRole);
  }

  // 2. CHECK 1: Chưa đăng nhập -> Về Login
  // Thêm state={{ from: location }} để sau khi login xong thì redirect lại đúng trang cũ
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Chuẩn hóa input về mảng để dễ xử lý
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  // 3. CHECK 2: Sai quyền (Unauthorized)
  // So sánh user.role với danh sách cho phép
  // Lưu ý: Đảm bảo user.role trong DB và requiredRole trong code giống hệt nhau (Admin vs Admin)
  if (requiredRole && !allowedRoles.includes(user.role)) {
    console.warn(` ACCESS DENIED: User '${user.role}' tried to access restricted route.`);
    
    // Logic Redirect thông minh hơn:
    // Nếu user là Admin mà lỡ lạc vào trang Member -> Về Admin Dashboard
    if (user.role === 'Admin') {
      return <Navigate to="/admin/home" replace />;
    }
    // Các role khác -> Về trang chủ Member
    return <Navigate to="/home" replace />;
  }

  // 4. Hợp lệ -> Render
  return children;
};

export default AppRouter;