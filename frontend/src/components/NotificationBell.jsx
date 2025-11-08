import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationBell({ notificationCount = 3 }) {
    const displayCount = notificationCount > 9 ? '9+' : notificationCount;
    return (
        <div className="relative cursor-pointer p-1">
            <BellIcon className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
            {notificationCount > 0 && (
                // Badge thông báo
                <div className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 rounded-full flex items-center justify-center text-white font-semibold border-2 border-white transform scale-90">
                    {displayCount}
                </div>
            )}
        </div>
    );
}
