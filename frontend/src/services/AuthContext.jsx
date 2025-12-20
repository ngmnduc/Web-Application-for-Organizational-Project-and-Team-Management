import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Định nghĩa URL API 
const API_URL = "http://localhost:4000/api"; 

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  // Gọi API lấy User mới nhất mỗi khi tải trang
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      // 1. Hiển thị tạm dữ liệu cũ để người dùng không thấy màn hình trắng
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 2. Gọi API /auth/me để lấy dữ liệu "tươi" từ DB
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (data.success) {
          // 3. Cập nhật lại State và LocalStorage với dữ liệu mới (Role Manager)
          setUser(data.data.user);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          console.log("🔄 Auth Context: User data refreshed from server");
        } else {
          // Nếu token hết hạn hoặc lỗi -> Logout
          logout();
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        // Nếu lỗi mạng, vẫn giữ user cũ từ localStorage
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  //  Logic đổi theme
  useEffect(() => {
    if (user && user.role === "Admin") {
      document.body.classList.add("admin-theme");
    } else {
      document.body.classList.remove("admin-theme");
    }
  }, [user]);

  const saveLogin = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    document.body.classList.remove("admin-theme");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, saveLogin, logout, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);