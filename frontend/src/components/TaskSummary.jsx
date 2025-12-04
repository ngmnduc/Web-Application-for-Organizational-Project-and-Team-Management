import React from 'react';

const TaskSummaryCard = ({ icon, number, label, iconColor, bgColor, textColor }) => {
 
  const coloredIcon = React.isValidElement(icon) 
    ? React.cloneElement(icon, { className: `w-5 h-5 ${iconColor}` }) 
    : icon;
  
  return (
    <div className="flex items-center space-x-3 p-4 bg-white rounded-xl flex-1 border border-gray-100 transition duration-150 hover:shadow-md cursor-pointer"> 
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColor} ${iconColor}`}>
          {coloredIcon}
      </div>
      <div>
          <div className={`text-xl font-semibold ${textColor}`}>
            {/* Hiển thị 0 nếu number chưa có giá trị */}
            {number ?? 0}
          </div>
          <div className="text-sm text-gray-500 flex items-center">
              {label}
          </div>
      </div>
    </div>
  );
};

const TaskSummary = ({ summaryData }) => {
    //  nếu không có data thì không render gì 
    if (!summaryData || summaryData.length === 0) return null;

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-8">
            <div className="flex flex-wrap md:flex-nowrap justify-between gap-4">
            {summaryData.map((task, index) => (
                <TaskSummaryCard 
                    key={index} 
                    {...task} // Spread props 
                />
            ))}
            </div>
        </div>
    );
}

export default TaskSummary;