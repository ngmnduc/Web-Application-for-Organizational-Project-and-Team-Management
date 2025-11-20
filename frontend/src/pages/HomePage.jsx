import React from 'react'
import TaskSummary from '../components/TaskSummary';
import { useOutletContext } from 'react-router-dom';
const HomePage = () => {
    const {  dynamicTasksSummary } = useOutletContext();
  return (
    
    <div className="p-6 space-y-6">
        {/* Filter + Export */}
        <div className="flex items-center justify-end gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700">
            <option>This month</option>
            <option>Last month</option>
            <option>This week</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity">
            Export report
          </button>
        </div>
        {/* Task Summary Section (Cards) */}
      <TaskSummary summaryData={dynamicTasksSummary} />


      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-2 gap-6">

        {/* ----- PROJECT STATUS (LEFT) ----- */}
        <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Project Status</h2>

          <div className="flex items-center justify-center">
            {/* Fake donut chart (bạn sẽ replace bằng chart thật sau) */}
            <div className="w-40 h-40 rounded-full border-[14px] border-blue-500 border-t-orange-400 border-r-green-500"></div>
          </div>

          <ul className="mt-5 space-y-1 text-gray-600">
            <li className="flex justify-between">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> In Progress</span>
              <span>12 (43%)</span>
            </li>
            <li className="flex justify-between">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Completed</span>
              <span>6 (21%)</span>
            </li>
            <li className="flex justify-between">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-400"></span> Todo</span>
              <span>10 (36%)</span>
            </li>
          </ul>
        </div>

        {/* ----- TASK PRIORITY (RIGHT) ----- */}
        <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Task Priority</h2>

          <Priority label="Low" count="8" percent="29%" color="bg-green-500" />
          <Priority label="Medium" count="12" percent="43%" color="bg-orange-500" />
          <Priority label="High" count="8" percent="29%" color="bg-red-500" />
        </div>

      </div>

      {/* ===== RECENT ACTIVITY ===== */}
      <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button className="text-blue-500 text-sm">View all activity</button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-bold">
            HN
          </div>

          <div>
            <p><span className="font-semibold">Huy Nguyen</span> ✔ completed <strong>"Update API Endpoint"</strong></p>
            <p className="text-xs text-gray-500">2h ago</p>
          </div>
        </div>
      </div>

    </div>
  );
};

{/* {// ----- REUSABLE COMPONENTS -----} */}

const Card = ({ icon, value, label }) => (
  <div className="bg-white border border-gray-100 p-4 rounded-xl shadow flex items-center gap-4">
    <div className="text-3xl">{icon}</div>
    <div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-gray-500">{label}</p>
    </div>
  </div>
);

const Priority = ({ label, count, percent, color }) => (
  <div className="mb-6">
    <div className="flex justify-between mb-1 text-sm text-gray-600">
      <span>{label}</span>
      <span>{count} ({percent})</span>
    </div>
    <div className="w-full h-3 bg-gray-100 rounded-full">
      <div className={`h-3 ${color} rounded-full`} style={{ width: percent }}></div>
    </div>
  </div>
    
  )


export default HomePage