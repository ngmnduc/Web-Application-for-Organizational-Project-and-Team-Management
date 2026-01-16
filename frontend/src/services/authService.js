import axiosInstance from "./api";

// Đăng ký
export const signup = async (name, email, password, inviteCode = null, plan = null) => {
  try {
    const response = await axiosInstance.post("/auth/signup", {
      name,
      email,
      password,
      inviteCode,
      plan,
    });

    if (response.data?.data?.token) {
      const { token, user, organization } = response.data.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (organization) {
        localStorage.setItem("organization", JSON.stringify(organization));
      }
      
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: { message: "Signup failed. Please try again!" } };
  }
};

// Đăng nhập
export const login = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });

    if (response.data?.data?.token) {
      const { token, user, organization } = response.data.data; 

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (organization) {
        localStorage.setItem("organization", JSON.stringify(organization));
      }
      
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: { message: "Invalid email or password!" } };
  }
};

// Lấy thông tin user hiện tại
export const getMe = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    const response = await axiosInstance.get("/auth/me");
    
    return response.data?.data?.user || null;
  } catch (error) {
    console.error("Error fetching user info:", error);
    if (error.response?.status === 401) {
      logout();
    }
    return null; 
  }
};

// [UPDATED] Hàm refresh profile có chống Cache
export const refreshProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // [FIX] Thêm timestamp để chặn Cache (Browser sẽ tưởng đây là URL mới và tải lại từ đầu)
    const response = await axiosInstance.get(`/auth/me?t=${new Date().getTime()}`);

    if (response.data?.data) {
        const { user, organization } = response.data.data;

        // Debug log để bố yên tâm là data mới đã về
        console.log("🔥 [Fresh Data Loaded]", { 
            plan: organization?.plan, 
            status: organization?.subscriptionStatus 
        });

        // Cập nhật User
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        }
        
        // Cập nhật Organization (để lấy Plan mới: PREMIUM)
        if (organization) {
            localStorage.setItem("organization", JSON.stringify(organization));
        }

        return { user, organization };
    }
    return null;
  } catch (error) {
    console.error("Failed to refresh profile:", error);
    return null;
  }
};

export const loginWithGoogle = async (credential) => {
  try {
    const response = await axiosInstance.post("/auth/google", { credential });
    
    if (response.data?.data?.token) {
      const { token, user } = response.data.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error("Google Login Service Error:", error);
    throw error.response?.data || { error: { message: "Google Login Failed" } };
  }
};

// Đăng xuất
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("organization"); 
  delete axiosInstance.defaults.headers.common["Authorization"];
};

export const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const initAuth = () => {
  const token = getToken();
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

// Hàm gửi yêu cầu quên mật khẩu (Gửi email)
export const requestPasswordReset = async (email) => {
  const response = await axiosInstance.post('/auth/forgot-password', { email });
  return response.data;
};

// Hàm đặt lại mật khẩu mới (khi đã có token)
export const resetPassword = async (token, newPassword) => {
  const response = await axiosInstance.post('/auth/reset-password', { 
    token, 
    newPassword 
  });
  return response.data;
};

// 1. Hủy gói (Cancel at period end)
export const cancelSubscription = async () => {
  try {
    const response = await axiosInstance.post('/payment/cancel');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// 2. Khôi phục gói (Resume)
export const resumeSubscription = async () => {
  try {
    const response = await axiosInstance.post('/payment/resume');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// 3. Lấy link Customer Portal (Đổi thẻ)
export const getPortalUrl = async () => {
  try {
    const response = await axiosInstance.post('/payment/portal');
    return response.data; // { success: true, url: "..." }
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
initAuth();