import axiosInstance from "./api";

// Lấy danh sách thông báo
export const getNotifications = async () => {
    try {
        const response = await axiosInstance.get('/notifications');
        // Backend trả về { success: true, data: [...] }
        return response.data.data || []; 
    } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
        return []; // Trả về mảng rỗng nếu lỗi để không crash App
    }
};

// Đánh dấu 1 thông báo là đã đọc
export const markAsRead = async (notificationId) => {
    try {
        await axiosInstance.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
        console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
};

// Đánh dấu tất cả (Frontend loop vì BE chưa có API)
export const markAllAsRead = async (notifications) => {
    try {
        const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
        await Promise.all(unreadIds.map(id => markAsRead(id)));
    } catch (error) {
        console.error("Lỗi khi đánh dấu tất cả:", error);
    }
};