import React, { useState } from 'react';
import { 
    CalendarIcon, 
    ChevronDownIcon, 
    ClockIcon, 
    BellIcon,
    ArrowPathIcon,
    CheckIcon,
    ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'; 

import { 
    ArrowPathIcon as ProgressSolid, 
    CheckCircleIcon as DoneSolid, 
    ClipboardDocumentListIcon as TotalSolid, 
    ClockIcon as ClockSolid, 
} from '@heroicons/react/24/solid';

const PRIMARY_COLOR = '#f35640'; 

// ---Task Summary Card Component---
const TaskSummary = () => {
    const tasks = [
        { count: 8, title: "Total", icon: TotalSolid, iconColor: "text-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-800" },
        { count: 0, title: "Todo", icon: ClockSolid, iconColor: "text-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-600" },
        { count: 1, title: "In Progress", icon: ProgressSolid, iconColor: "text-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-600" },
        { count: 0, title: "Done", icon: DoneSolid, iconColor: "text-green-500", bgColor: "bg-green-100", textColor: "text-green-600" },
    ];

    const Card = ({ count, title, icon: Icon, iconColor, bgColor, textColor }) => (
        <div className="flex items-center space-x-3 p-4 bg-white rounded-xl flex-1 border border-gray-100 transition duration-150 hover:shadow-md">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColor} ${iconColor}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className={`text-xl font-semibold ${textColor}`}>{count}</div>
                <div className="text-sm text-gray-500">{title}</div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-wrap md:flex-nowrap space-y-2 md:space-y-0 md:space-x-4 mb-6 p-2 bg-white rounded-xl shadow-lg border border-gray-100">
            {tasks.map((task, index) => (
                <Card 
                    key={index} 
                    count={task.count} 
                    title={task.title} 
                    icon={task.icon}
                    iconColor={task.iconColor}
                    bgColor={task.bgColor}
                    textColor={task.textColor}
                />
            ))}
        </div>
    );
};

// ---Calendar Panel---
const CalendarPanel = ({ checkedInDaysList, isLoading }) => {
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    // Giả lập lịch tháng 5/2025 
    const dates = [
        null, null, null, null, 1, 2, 3, 
        4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 16, 17, // 16 là ngày đang chọn
        18, 19, 20, 21, 22, 23, 24,
        25, 26, 27, 28, 29, 30, 31,
    ];
    
    // Dữ liệu tĩnh: Ngày có sự kiện và ngày đã check-in
    const defaultEventDays = [17, 23, 24, 25, 31];
    const mockCheckedInDays = [5, 12];
    const eventsDays = new Set([...defaultEventDays, ...mockCheckedInDays]);

    const DayCell = ({ date }) => {
        if (!date) return <div className="p-1"></div>;
        
        const isSelected = date === 16; 
        const isCheckedIn = mockCheckedInDays.includes(date);
        const hasEvent = eventsDays.has(date);

        let dayClasses = `p-1 flex flex-col items-center justify-center text-sm relative transition-all duration-150 rounded-full w-8 h-8 self-center mx-auto cursor-pointer`;

        if (isSelected) {
            // Ngày đang chọn
            dayClasses += ` text-white font-semibold`;
            dayClasses += ` rounded-lg shadow-lg`; 
            dayClasses = dayClasses.replace("bg-red-600", ""); 
        } else {
            // Ngày bình thường
            dayClasses += ` text-gray-800 hover:bg-gray-100`;
            if (isCheckedIn) {
                dayClasses += ` text-blue-600 font-medium`; // Ngày đã check-in màu xanh
            }
        }
        
        return (
            <div className="p-0.5">
                <div 
                    className={dayClasses}
                    style={isSelected ? { backgroundColor: PRIMARY_COLOR } : {}}
                >
                    <div className={isSelected ? 'relative top-[1px]' : ''}>
                        {date}
                    </div>
                    {/* Dấu chấm sự kiện */}
                    {hasEvent && !isCheckedIn && ( // Chỉ hiển thị dấu chấm nếu có sự kiện và chưa check-in
                        <div className="w-1 h-1 bg-gray-400 rounded-full mt-1 absolute bottom-1"></div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col flex-grow">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4 text-gray-700 font-semibold">
                    <button className="text-xl text-gray-400 hover:text-gray-700 transition" aria-label="Previous Month">&lt;</button>
                    <span>May 2025</span>
                    <button className="text-xl text-gray-400 hover:text-gray-700 transition" aria-label="Next Month">&gt;</button>
                </div>
                <button 
                    className="px-4 py-1 text-sm text-white font-medium rounded-lg hover:opacity-90 transition duration-150 border-2" 
                    style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, }}
                >
                    Today
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs flex-grow">
                {daysOfWeek.map((day) => (
                    <div key={day} className="text-gray-500 font-medium pt-2 pb-1 text-xs md:text-sm">
                        {day}
                    </div>
                ))}
                {dates.map((date, index) => (
                    <DayCell key={index} date={date} />
                ))}
            </div>
        </div>
    );
};

// ---Event/Attendance Panel---
const EventPanel = () => {
    // State đơn giản cho UI check-in
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState(null);

    const handleMockCheckIn = () => {
        if (isCheckedIn || isCheckingIn) return;

        setIsCheckingIn(true);
        // Giả lập độ trễ ngắn cho UI
        setTimeout(() => {
            const timeString = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); 
            setCheckInTime(timeString);
            setIsCheckedIn(true);
            setIsCheckingIn(false);
        }, 800);
    };

    let buttonText = "Check in";
    let buttonStyle = { backgroundColor: PRIMARY_COLOR };
    
    if (isCheckingIn) {
        buttonText = "Checking In...";
        buttonStyle = { backgroundColor: '#f97316' }; // Loading (màu cam)
    } else if (isCheckedIn) {
        buttonText = `Checked In (${checkInTime})`;
        buttonStyle = { backgroundColor: '#10b981' }; // Success (màu xanh lá)
    }

    return (
        <div className="space-y-6 flex flex-col flex-grow">
            {/* Attendance Today Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Today</h2>
                <button 
                    className="w-auto self-start mt-0.2 px-4 py-1.5 text-sm text-white font-medium rounded-lg hover:opacity-90 transition duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={handleMockCheckIn}
                    disabled={isCheckedIn || isCheckingIn}
                    style={buttonStyle}
                >
                    {buttonText}
                </button>
            </div>

            {/* Events on Specific Day Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col flex-grow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Events on Friday, May 16, 2025</h2>
                
                <div className="flex flex-col items-center justify-center flex-grow text-center text-gray-500">
                    {/* Calendar Icon */}
                    <div className="mb-4 p-4 bg-gray-100 rounded-full">
                        <CalendarIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>No events scheduled for this day</p>
                </div>
            </div>
        </div>
    );
};

// ---Calendar Page Component---
const Calendar = () => {
    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen font-sans">
            <TaskSummary />
            {/* Main Content: Calendar and Events  */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch min-h-[550px]">
                {/* Cột Trái: Calendar Panel */}
                <div className="md:col-span-1 flex flex-col flex-grow"> 
                    <CalendarPanel 
                        checkedInDaysList={[5, 12]}
                        isLoading={false} 
                    />
                </div>
                {/* Cột Phải: Event Panel  */}
                <div className="md:col-span-2 flex flex-col flex-grow">
                    <EventPanel />
                </div>
            </div>
        </div>
    );
}

export default Calendar;
