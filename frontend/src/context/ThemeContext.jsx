import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/constants';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Lấy theme từ LocalStorage ngay lúc khởi tạo để tránh bị nháy sáng
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'Light';
        }
        return 'Light';
    });

    // Effect: Tự động thêm/xóa class 'dark' vào thẻ HTML khi theme đổi
    useEffect(() => {
        const root = window.document.documentElement;
        
        // Xóa sạch class cũ
        root.classList.remove('light', 'dark');

        if (theme === 'Dark') {
            root.classList.add('dark');
        } else {
            root.classList.add('light');
        }

        // Lưu vào LocalStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Hàm đổi theme (Gọi từ Settings)
    const toggleTheme = (newTheme) => {
        setTheme(newTheme);

        // Gọi API lưu xuống DB
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_BASE_URL}/users/preferences`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ theme: newTheme })
            }).catch(err => console.error("Sync theme error:", err));
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);