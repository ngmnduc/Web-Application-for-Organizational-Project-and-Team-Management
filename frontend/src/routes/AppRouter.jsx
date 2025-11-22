import React from 'react'
import { Navigate } from 'react-router-dom'

const AppRouter = ({children,requiredRole}) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  
  // 1. Nếu chưa login → về lại /login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu trang này yêu cầu role nhưng user không khớp
  if (requiredRole && user.role !== requiredRole) {
    // Redirect theo role hiện tại
    return (
      <Navigate
        to={user.role === "ADMIN" ? "/admin/home" : "/home"}
        replace
      />
    );
  }

  // 3. Đủ quyền → cho vào trang
  return children;
}

export default AppRouter