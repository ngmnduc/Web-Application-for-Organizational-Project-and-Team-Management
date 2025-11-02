import React from 'react';
import { 
  ClipboardDocumentListIcon, 
  ClockIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  BellIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon, 
} from '@heroicons/react/24/outline'; 

import { 
    ClipboardDocumentListIcon as TotalSolid, 
    ClockIcon as ClockSolid,
    ArrowPathIcon as ProgressSolid, 
    CheckCircleIcon as DoneSolid,
    ExclamationTriangleIcon as WarningSolid, 
} from '@heroicons/react/24/solid';


// --- Task Summary Card Component ---
const TaskSummaryCard = ({ icon, number, label, iconColor, bgColor, textColor }) => {
  
  // Áp dụng iconColorClass vào icon
  const coloredIcon = React.cloneElement(icon, { className: `w-5 h-5 ${iconColor}` });
  
  return (
    <div className="flex items-center space-x-3 p-4 bg-white rounded-xl flex-1 border border-gray-100 transition duration-150 hover:shadow-md cursor-pointer"> 
      {/* Icon Circle */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColor} ${iconColor}`}>
          {coloredIcon}
      </div>
      
      {/* Text Content */}
      <div>
          <div className={`text-xl font-semibold ${textColor}`}>{number}</div>
          <div className="text-sm text-gray-500 flex items-center">
              {label}
          </div>
      </div>
    </div>
  );
};


// --- MyTasks Component ---
const MyTasks = () => {

  const taskDataFixed = [
    { number: 14, label: 'Total', icon: <TotalSolid />, iconColor: "text-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-800" },
    { number: 6, label: 'Todo', icon: <ClockSolid />, iconColor: "text-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-600" },
    { number: 5, label: 'In Progress', icon: <ProgressSolid />, iconColor: "text-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-600" },
    { number: 3, label: 'Done', icon: <DoneSolid />, iconColor: "text-green-500", bgColor: "bg-green-100", textColor: "text-green-600" },
    { number: 1, label: '1 day left', icon: <WarningSolid />, iconColor: "text-orange-500", bgColor: "bg-orange-100", textColor: "text-orange-600" },
  ];

  const filterOptions = [
    { label: 'All statuses', active: true },
    { label: 'Me', active: false },
    { label: 'All projects', active: false },
    { label: 'All', active: false },
  ];
  
  const statusCounts = [
    { label: 'Backlog', count: 8 },
    { label: 'Todo', count: 6 },
    { label: 'In Progress', count: 4 },
    { label: 'Done', count: 12 },
  ];

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen font-sans">

      {/* Filters Section */}
      <div className="flex flex-wrap gap-3 mb-6">
        {filterOptions.map((option, index) => (
          <button 
            key={index}
            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg border transition duration-150 shadow-sm
              ${option.active 
                ? 'bg-white border-blue-500 text-blue-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100' 
              }`}
          >
            <span>{option.label}</span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </button>
        ))}
      </div>
      <div className="border-t border-gray-200 mb-8"></div>

      {/* Task Summary Section (Cards) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-8">
        <div className="flex flex-wrap md:flex-nowrap justify-between gap-4">
          {taskDataFixed.map((task, index) => (
            <TaskSummaryCard key={index} {...task} />
          ))}
        </div>
      </div>

      {/* Task List Section Headers (Bottom part of the image) */}
      <div className="flex justify-between items-center text-sm font-bold text-gray-700 pt-4 px-2">
          {statusCounts.map((status, index) => (
              <div 
                  key={index} 
                  className={`py-2 px-3 rounded-t-lg transition-all duration-300 
                      text-gray-500`} 
              >
                  {status.label} ({status.count})
              </div>
          ))}
      </div>
      
      {/* Placeholder for Task List - Added a line to complete the UI context */}
      <div className="border-t border-gray-200 mt-[-1px]"></div>
    </div>
  );
}

export default MyTasks;
