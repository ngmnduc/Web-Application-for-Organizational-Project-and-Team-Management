import React from 'react';

export const CalendarDayCell = ({ date, isSelected, isCheckedIn, hasEvent }) => {
    // Nếu không có ngày (ô trống), render một ô trống
    if (!date) {
        return <div className="p-1"></div>;
    }

    // --- Base Classes ---
    let dayClasses = `p-1 flex flex-col items-center justify-center text-sm relative transition-all duration-150 w-8 h-8 self-center mx-auto cursor-pointer`;

    if (isSelected) {
        // ĐANG CHỌN (Ưu tiên cao nhất) - Nền Brand
        dayClasses += ` text-white font-semibold rounded-lg shadow-lg transform scale-105 z-10`;
    } else if (isCheckedIn) {
        // ĐÃ CHECK-IN - Nền Xanh
        dayClasses += ` bg-green-500 text-white font-medium rounded-md shadow-sm hover:bg-green-600`;
    } else {
        // BÌNH THƯỜNG - Nền Trắng
        dayClasses += ` text-gray-800 hover:bg-gray-100 rounded-full`;
    }

    return (
        <div className="p-0.5">
            <div 
                className={dayClasses}
                style={isSelected ? { backgroundColor: 'var(--color-brand)' } : {}}
            >
                {/* Số ngày (đẩy lên z-index cao để không bị che) */}
                <div className="z-10 relative">
                    {date}
                </div>
                
                {/* --- THANH GẠCH NGANG BÁO SỰ KIỆN --- */}
                {/* Luôn hiện nếu hasEvent = true */}
                {hasEvent && (
                    <div 
                        className={`absolute bottom-1 h-[3px] w-4 rounded-full z-20 ${
                            // Nếu đang Chọn hoặc Check-in (Nền tối) -> Dùng màu Trắng
                            (isSelected || isCheckedIn) 
                                ? 'bg-white shadow-sm opacity-90' 
                                // Nếu nền trắng -> Dùng màu đỏ 
                                : 'bg-red-500'
                        }`}
                    ></div>
                )}
            </div>
        </div>
    );
};

export default CalendarDayCell;