import React, { useState } from 'react';
import { 
    ChevronDownIcon, 
    BellIcon, 
    CheckIcon,
    CalendarIcon, 
    ChatBubbleLeftIcon, 
    ClockIcon, 
    ClipboardDocumentListIcon, 
    CheckCircleIcon, 
    UserGroupIcon,
} from '@heroicons/react/24/outline'; 
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';

const PRIMARY_COLOR = '#f35640'; 

// ---Header Icons---
const HeaderIcons = () => {
    return (
        <div className="flex space-x-4 items-center">
            {/* Notification Bell Icon */}
            <div className="relative cursor-pointer p-1.5 rounded-full hover:bg-gray-100 transition">
                <BellIcon className="w-6 h-6 text-gray-700" />
                {/* Notification Badge */}
                <div className="absolute top-0 right-0 w-3 h-3 text-xs bg-red-500 rounded-full border-2 border-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                </div>
            </div>

            {/* Avatar/User Icon */}
            <div className="flex items-center space-x-2 cursor-pointer">
                <div className="relative cursor-pointer w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                    JD
                    <div className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-red-500 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: PRIMARY_COLOR }}>
                        30
                    </div>
                </div>
                
                {/* Dropdown Icon */}
                <ChevronDownIcon className="w-4 h-4 text-gray-700 cursor-pointer" />
            </div>
        </div>
    );
};

// ---Notification Item Component---
const NotificationItem = ({ type, project, task, sender, time, unread = true, avatarUrl }) => {
    let title, Icon, iconColor, content; 
    
    // Gán icon và nội dung dựa trên loại thông báo
    switch (type) {
        case 'assigned':
            Icon = UserGroupIcon;
            iconColor = 'text-purple-500';
            title = `You were assigned to Task "${task}"`;
            content = `${sender} assigned you to this task in ${project} project`;
            break;
        case 'mention':
            Icon = ChatBubbleLeftIcon;
            iconColor = 'text-blue-500';
            title = `${sender} mentioned you in a comment`;
            content = `@You Great work on the API integration! Can you review the documentation?`;
            break;
        case 'due_soon':
            Icon = ClockIcon;
            iconColor = 'text-yellow-500';
            title = `Task "${task}" is due soon`;
            content = `This task is due tomorrow at 5:00 PM`;
            break;
        case 'completed':
            Icon = SolidCheckCircleIcon;
            iconColor = 'text-green-500';
            title = `${sender} completed "${task}"`;
            content = `${sender} marked as complete in ${project} project`;
            break;
        case 'comment':
            Icon = ChatBubbleLeftIcon;
            iconColor = 'text-indigo-500';
            title = `New comment on "User Authentication"`;
            content = `${sender}: I've updated the security requirements. Please review.`;
            break;
        default:
            Icon = ClipboardDocumentListIcon;
            iconColor = 'text-gray-500';
            title = "New Notification";
            content = "This is a generic notification message.";
    }

    // Avatar Component
    const Avatar = ({ url, senderName }) => (
        <div 
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600"
            style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover' }}
        >
            {!url && senderName.substring(0, 2).toUpperCase()}
        </div>
    );

    // Icon Project 
    const ProjectIcon = ({ type }) => {
        let icon;
        switch (type) {
            case 'due_soon':
                icon = 'O'; // Icon mock cho Task
                break;
            default:
                icon = 'JD'; // Default
        }
        return (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4" style={{ backgroundColor: PRIMARY_COLOR }}>
                {icon}
            </div>
        );
    }


    return (
        <div className={`flex items-start p-4 hover:bg-gray-50 transition border-b border-gray-100 ${unread ? 'bg-white' : 'bg-gray-50'}`}>
            
            {/* Avatar hoặc Icon Project */}
            {type === 'due_soon' ? (
                <ProjectIcon type={type} />
            ) : (
                <Avatar senderName={sender} url={avatarUrl} />
            )}

            {/* Content */}
            <div className="flex-1 ml-4 flex flex-col">
                <p className="text-sm font-medium text-gray-900 cursor-pointer hover:text-red-600 transition">
                    {title}
                </p>
                <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">
                    {content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    {time}
                </p>
            </div>

            {/* Icon Trạng thái / Unread Dot */}
            <div className="w-5 flex justify-end">
                {unread ? (
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-2" />
                )}
            </div>
        </div>
    );
};

// ---Notification List Panel---
const NotificationList = () => {
    const [filter, setFilter] = useState('All'); // 'All' | 'Unread'

    // Dữ liệu giả lập (mock data)
    const notifications = [
        { id: 1, type: 'assigned', project: 'Website Redesign', task: 'Design Homepage', sender: 'Sarah Chen', time: '2h ago', unread: true, avatarUrl: null },
        { id: 2, type: 'mention', project: 'API Integration', task: 'N/A', sender: 'Michael Brown', time: '4h ago', unread: true, avatarUrl: null },
        { id: 3, type: 'due_soon', project: 'N/A', task: 'API Documentation', sender: 'System', time: '5h ago', unread: true, avatarUrl: null },
        { id: 4, type: 'completed', project: 'Backend Development', task: 'Database Migration', sender: 'Emily Zhang', time: 'Yesterday', unread: false, avatarUrl: null },
        { id: 5, type: 'comment', project: 'N/A', task: 'User Authentication', sender: 'James Wilson', time: 'Yesterday', unread: false, avatarUrl: null },
        { id: 6, type: 'assigned', project: 'Mobile Development', task: 'Mobile App Testing', sender: 'Maria Garcia', time: '2 days ago', unread: false, avatarUrl: null },
    ];

    const filteredNotifications = notifications.filter(n => 
        filter === 'All' || (filter === 'Unread' && n.unread)
    );

    const handleMarkAllRead = () => {
        // Giả lập logic đánh dấu đã đọc
        console.log("Mark all notifications as read");
        // Đã thay thế alert bằng console log để tuân thủ quy tắc không dùng alert()
        // Bạn nên thay thế bằng UI modal nếu cần hiển thị thông báo.
        console.log("All notifications marked as read!"); 
    }
    
    // Nút tab filter
    const FilterButton = ({ label, currentFilter, onClick }) => {
        const isActive = label === currentFilter;
        return (
            <button
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                        ? 'text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: PRIMARY_COLOR } : {}}
                onClick={() => onClick(label)}
            >
                {label}
                {label === 'Unread' && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-600" style={{ color: PRIMARY_COLOR, backgroundColor: '#fee2e2' }}>
                        {notifications.filter(n => n.unread).length}
                    </span>
                )}
            </button>
        );
    }


    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col min-h-[70vh]">
            {/* Header: Filters and Mark All Read */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <div className="flex space-x-3">
                    <FilterButton label="All" currentFilter={filter} onClick={setFilter} />
                    <FilterButton label="Unread" currentFilter={filter} onClick={setFilter} />
                </div>
                <button 
                    className="text-sm font-medium text-gray-500 hover:text-red-600 transition"
                    onClick={handleMarkAllRead}
                >
                    Mark all as read
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(n => (
                        <NotificationItem 
                            key={n.id}
                            {...n}
                        />
                    ))
                ) : (
                    <div className="p-10 text-center text-gray-500">
                        <CheckIcon className="w-12 h-12 mx-auto mb-4 text-green-400"/>
                        <p className="text-lg">You are all caught up!</p>
                        <p className="text-sm">No new notifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ---Notification Page Component---
const Notification = () => {
    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500">View recent updates and mentions across your projects</p>
                </div>
                {/* Header Icons (Avatar và Bell) */}
                <HeaderIcons /> 
            </div>
            
            {/* Nội dung chính: Danh sách thông báo */}
            <div className="max-w-4xl mx-auto"> 
                <NotificationList />
            </div>
        </div>
    );
}


export default Notification;
