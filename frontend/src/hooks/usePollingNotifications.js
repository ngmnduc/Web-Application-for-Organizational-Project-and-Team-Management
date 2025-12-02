import { useState, useEffect, useCallback } from 'react';
import { getNotifications } from '../services/notificationService';

export const usePollingNotifications = (interval = 30000) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    // Hàm lấy dữ liệu từ Server
    const fetchNotifications = useCallback(async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
            
            // Đếm số lượng chưa đọc (field 'read' của backend là false)
            const count = data.filter(n => !n.read).length; 
            setUnreadCount(count);
            
            setIsError(false);
        } catch (error) {
            // console.error("Lỗi Polling Notification:", error); 
            // (Có thể comment log lỗi để đỡ rác console nếu user chưa login)
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Gọi ngay khi component mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Thiết lập Polling: Gọi lại sau mỗi khoảng interval (30s)
    useEffect(() => {
        if (!interval) return;
        
        const timer = setInterval(() => {
            getNotifications().then(data => {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            });
        }, interval);
        
        return () => clearInterval(timer);
    }, [interval]);

    return { notifications, unreadCount, isLoading, isError, refresh: fetchNotifications };
};