import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { formatDistanceToNow } from 'date-fns';
import axiosInstance from '../services/api';
import { getProjects } from "../services/projectService"; // 🔵 Thêm
import TaskSummary from '../components/TaskSummary';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const HomePage = () => {

  const { dynamicTasksSummary } = useOutletContext();

  // ----------------------------------------------------------
  // 🔵 STATE THÊM MỚI
  // ----------------------------------------------------------
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  // ----------------------------------------------------------

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // 🔵 LOAD DANH SÁCH PROJECTS
  // ----------------------------------------------------------
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const list = await getProjects();
        setProjects(list);

        if (list.length > 0) {
         // Ưu tiên lấy _id, nếu không có thì thử id (đề phòng backend trả về id ảo)
         const firstId = list[0]._id || list[0].id; 
         console.log(">>> Chọn Project ID mặc định:", firstId); // Log để kiểm tra
         setCurrentProjectId(firstId);
        }
      } catch (error) {
        console.error("Failed to load projects", error);
      }
    };

    loadProjects();
  }, []);
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // 🔵 LOAD SUMMARY + ACTIVITY MỖI KHI currentProjectId THAY ĐỔI
  // ----------------------------------------------------------
  useEffect(() => {
    if (!currentProjectId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, activityRes] = await Promise.all([
          axiosInstance.get(`/projects/${currentProjectId}/summary`),
          axiosInstance.get(`/projects/${currentProjectId}/activities`)
        ]);

        setStats(summaryRes.data);
        setActivities(activityRes.data.activities || activityRes.data || []);

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentProjectId]);
  // ----------------------------------------------------------

  // --- CONFIG HELPER CHO CHART & COLOR ---
  const getStatusConfig = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'done') return { color: '#22c55e', tailwind: 'bg-green-500', label: 'Completed' };
    if (s === 'in-progress' || s === 'doing') return { color: '#3b82f6', tailwind: 'bg-blue-500', label: 'In Progress' };
    if (s === 'todo') return { color: '#fb923c', tailwind: 'bg-orange-400', label: 'Todo' };
    return { color: '#9ca3af', tailwind: 'bg-gray-400', label: status };
  };

  const getPriorityConfig = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'high') return 'bg-red-500';
    if (p === 'medium') return 'bg-orange-500';
    return 'bg-green-500';
  };

  // --- CHART CONFIG ---
  const getChartOption = () => {
    if (!stats?.tasksByStatus) return { series: [] };

    // Tạo dữ liệu thủ công từ các trường riêng lẻ của Backend
    const data = [
      { value: stats.todo || 0, name: 'Todo', itemStyle: { color: '#fb923c' } },   // Cam
      { value: stats.doing || 0, name: 'Doing', itemStyle: { color: '#3b82f6' } }, // Xanh dương
      { value: stats.done || 0, name: 'Done', itemStyle: { color: '#22c55e' } },   // Xanh lá
    ];

    // Lọc bỏ các mục có giá trị 0 để biểu đồ đẹp hơn (tuỳ chọn)
    const validData = data.filter(item => item.value > 0);

    // Nếu không có task nào
    if (validData.length === 0) {
        return {
            title: { text: 'No Tasks', left: 'center', top: 'center', textStyle: { color: '#ccc', fontSize: 14 } },
            series: [{ type: 'pie', radius: ['65%', '90%'], data: [{ value: 0, name: '', itemStyle: { color: '#f3f4f6' } }] }]
        }
    }

    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          name: 'Tasks',
          type: 'pie',
          radius: ['65%', '90%'],
          avoidLabelOverlap: false,
          label: { show: false },
          data: validData
        }
      ]
    };
  };

  return (
    <div className="p-6 space-y-6">

      
      {/* Filter + Export */}
      <div className="flex items-center justify-end gap-3">
        <div className='relative'>
         <select
          className="border border-gray-300 px-2 py-2 rounded-lg appearance-none cursor-pointer"
          value={currentProjectId || ""}
          onChange={(e) => setCurrentProjectId(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
        <div className='relative'>
        <select className="border border-gray-300 rounded-lg px-7 py-2 text-gray-700 appearance-none cursor-pointer">
          <option>This month</option>
          <option>Last month</option>
          <option>This week</option>
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-brand)] text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity">
          Export report
        </button>
      </div>

      {/* Task Summary */}
      <TaskSummary summaryData={dynamicTasksSummary} />

      {/* --------- MAIN GRID --------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status */}
        <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Project Status</h2>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Loading chart...</div>
          ) : stats?.tasksByStatus?.length > 0 ? (
            <>
              <div className="flex items-center justify-center h-48">
                <ReactECharts 
                  option={getChartOption()} 
                  style={{ height: '100%', width: '100%' }}
                />
              </div>

              <ul className="mt-5 space-y-2 text-gray-600">
                {stats.tasksByStatus.map((item) => {
                   const config = getStatusConfig(item._id);
                   const percent = stats.totalTasks ? Math.round((item.count / stats.totalTasks) * 100) : 0;
                   return (
                    <li key={item._id} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${config.tailwind}`}></span> 
                        {config.label}
                      </span>
                      <span>{item.count} ({percent}%)</span>
                    </li>
                   );
                })}
              </ul>
            </>
          ) : (
            <div className="text-center text-gray-500 py-10">No tasks data available</div>
          )}
        </div>

        {/* Priority */}
        <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Task Priority</h2>
          
          {loading ? (
             <p className="text-gray-400">Loading priorities...</p>
          ) : (stats && stats.priority) ? (
             <>
                <Priority label="High" count={stats.priority.high || 0} total={stats.totalTasks} color="bg-red-500" />
                <Priority label="Medium" count={stats.priority.medium || 0} total={stats.totalTasks} color="bg-orange-500" />
                <Priority label="Low" count={stats.priority.low || 0} total={stats.totalTasks} color="bg-green-500" />
             </>
          ) : (
            <p className="text-center text-gray-500 mt-10">No priority data</p>
          )}
        </div>

      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button className="text-blue-500 text-sm hover:underline">View all activity</button>
        </div>

        <div className="space-y-4">
          {loading ? (
             <p className="text-gray-400 text-sm">Loading activities...</p>
          ) : activities.length > 0 ? (
            activities.slice(0, 5).map((act) => (
              <div key={act._id} className="flex items-start gap-3">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-bold uppercase text-sm">
                  {act.userId?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{act.userId?.name || "Unknown"}</span> 
                    {' '}{act.text || act.action || "updated a task"} 
                    {act.taskName && <strong> "{act.taskName}"</strong>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {act.createdAt ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }) : ''}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No recent activities found.</p>
          )}
        </div>
      </div>

    </div>
  );
};

// --- Component con để render (Clean code) ---

const StatusItem = ({ label, count, total, color }) => {
    const val = count || 0;
    const percent = total > 0 ? Math.round((val / total) * 100) : 0;
    return (
        <li className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${color}`}></span> {label}
            </span>
            <span>{val} ({percent}%)</span>
        </li>
    );
}

const Priority = ({ label, count, total, color }) => {
  const val = count || 0;
  const percent = total > 0 ? Math.round((val / total) * 100) : 0;
  return (
    <div className="mb-6 last:mb-0">
        <div className="flex justify-between mb-1 text-sm text-gray-600">
        <span>{label}</span>
        <span>{val} ({percent}%)</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full">
        <div className={`h-3 ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
        </div>
    </div>
  );
};

export default HomePage;