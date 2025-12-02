import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/images/syncora.png'; 
import { 
    Squares2X2Icon, 
    CalendarDaysIcon, 
    BellIcon, 
    Cog6ToothIcon, 
    FolderIcon, 
    BriefcaseIcon,  
    UsersIcon,     
} from '@heroicons/react/24/outline';
import { useAuth } from '../services/AuthContext';

const PRIMARY_COLOR = '#f35640'; 

// --- Sidebar Item ---
const SidebarItem = ({ item, isActive, unreadCount, fullPath }) => {
    const activeStyle = {
        backgroundColor: isActive ? PRIMARY_COLOR : 'transparent',
    };

    return (
        <Link
            to={fullPath} 
            className="flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 cursor-pointer text-sm font-medium group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            style={activeStyle}
        >
            <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span className={isActive ? 'text-white font-semibold' : 'text-gray-700 group-hover:text-gray-900'}>
                {item.name}
            </span>
            
            {item.name === 'Notifications' && !isActive && unreadCount > 0 && (
                <span className="ml-auto min-w-4 h-4 px-1 text-[10px] bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    );
};

const SideBar = ({ unreadCount, basePath="" }) => {
    const location = useLocation();
    const currentPath = location.pathname;
    
    // Lấy thông tin user để check quyền
    const { user } = useAuth(); 
    const isAdmin = user?.role === 'Admin';

    // Định nghĩa menu gốc
    const allMenuItems = [
        { name: 'Dashboard', icon: Squares2X2Icon, href: '/home' },
        { name: 'My Tasks', icon: FolderIcon, href: '/tasks' },
        { name: 'Calendar', icon: CalendarDaysIcon, href: '/calendar' },
        { name: 'Members', icon: UsersIcon, href: '/members' },
        { name: 'Projects', icon: BriefcaseIcon, href: '/projects', adminOnly: true }, 
        { name: 'Notifications', icon: BellIcon, href: '/notifications' },
        { name: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
    ];

    // Lọc menu dựa trên quyền
    const visibleMenuItems = allMenuItems.filter(item => {
        if (item.adminOnly && !isAdmin) return false; // Ẩn nếu là Admin Only mà user không phải Admin
        return true;
    });

    const isActive = (href) => {
        const fullPath = `${basePath}${href}`;
        if (href === '/home') return currentPath === fullPath;
        return currentPath.startsWith(fullPath);
    };

    return (
        <div className="w-56 bg-white border-r h-screen flex flex-col shadow-lg">
            <div className="flex items-center justify-center gap-2 px-3 pt-8 pb-4">
                <a className='flex items-center' href='/home'> 
                    <img className="h-9 w-auto" src={ logo } alt="Syncora Logo" />
                </a>
            </div>

            <nav className="space-y-2 px-3 pb-4 flex-grow">
                {visibleMenuItems.map((item) => (
                    <SidebarItem 
                        key={item.href}
                        item={item}
                        isActive={isActive(item.href)}
                        unreadCount={unreadCount}
                        fullPath={`${basePath}${item.href}`}
                    />
                ))}
            </nav>
        </div>
    );
}

export default SideBar;