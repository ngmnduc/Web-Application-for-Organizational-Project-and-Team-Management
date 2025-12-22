import axiosInstance from "../services/api"; // Đường dẫn tới file axios bạn vừa gửi

const dashboardService = {
  // 1. Lấy số liệu cho Admin
  getAdminStats: async () => {
    const response = await axiosInstance.get("/dashboard/admin-stats");
    return response.data.data;
  },

  // 2. Lấy số liệu cho Manager
  getManagerStats: async () => {
    const response = await axiosInstance.get("/dashboard/manager-stats");
    return response.data.data;
  },

  // 3. Lấy số liệu cho Member (Cá nhân)
  getMemberStats: async () => {
    const response = await axiosInstance.get("/dashboard/member-stats");
    return response.data.data;
  },
};

export default dashboardService;