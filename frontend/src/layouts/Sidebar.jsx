import React, { useState } from 'react';
import { 
    Squares2X2Icon, 
    CalendarDaysIcon, 
    BellIcon, 
    Cog6ToothIcon, 
    FolderIcon 
} from '@heroicons/react/24/outline'; // Đã loại bỏ ArrowLeftStartOnRectangleIcon

// Màu chủ đạo tùy chỉnh (RED-ORANGE)
const PRIMARY_COLOR = '#f35640'; 

// Dữ liệu menu đã cập nhật: Thêm Dashboard và điều chỉnh icon
const menuItems = [
    { name: 'Dashboard', icon: Squares2X2Icon, href: '/' }, // Mới: Mục Dashboard
    { name: 'My Tasks', icon: FolderIcon, href: '/tasks' }, // Đổi icon sang FolderIcon
    { name: 'Calendar', icon: CalendarDaysIcon, href: '/calendar' },
    { name: 'Notifications', icon: BellIcon, href: '/notifications' },
    { name: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
];

// Component từng mục menu
const SidebarItem = ({ item, isActive, onClick }) => {
    // Màu nền cho mục menu đang hoạt động
    const activeStyle = {
        backgroundColor: isActive ? PRIMARY_COLOR : 'transparent',
        color: isActive ? 'white' : '#6b7280', // text-gray-500
    };

    return (
        <a
            href={item.href}
            onClick={onClick}
            className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 cursor-pointer text-base font-medium group"
            style={activeStyle}
        >
            <item.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span className={isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-800'}>
                {item.name}
            </span>
            {item.name === 'Notifications' && !isActive && (
                 <span className="ml-auto w-5 h-5 text-xs bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                     3
                 </span>
            )}
        </a>
    );
};

// Component chính Sidebar
export default function Sidebar() {
    // Cập nhật trạng thái active, mặc định là Dashboard
    const [activeItem, setActiveItem] = useState('/'); 

    const handleItemClick = (href) => {
        setActiveItem(href);
    };

    return (
        // Sử dụng flex-grow để menu chính chiếm không gian còn lại
        <div 
            className="w-64 flex-shrink-0 bg-white border-r border-gray-200 p-6 flex flex-col h-screen" 
        >
            {/* Logo/Project Title */}
            <div className="flex items-center space-x-2 mb-8 p-1">
                <div className="p-2 rounded-lg text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                    {/* Sử dụng Squares2X2Icon cho logo/tên ứng dụng */}
                    <Squares2X2Icon className="w-6 h-6" /> 
                </div>
                <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
            </div>

            {/* Menu chính */}
            <nav className="space-y-2 flex-grow">
                {menuItems.map((item) => (
                    <SidebarItem 
                        key={item.href}
                        item={item}
                        isActive={activeItem === item.href}
                        // Ngăn chặn chuyển hướng thực tế (cho mục đích demo)
                        onClick={(e) => {
                            e.preventDefault(); 
                            handleItemClick(item.href);
                        }}
                    />
                ))}
            </nav>
        </div>
    );
}
