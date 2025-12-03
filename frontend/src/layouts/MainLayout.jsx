import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideBar from '../components/SideBar';
import Navbar from '../components/NavBar'; 
import { mockKanbanTasks } from '../mocks/tasks.jsx';
import { usePollingNotifications } from '../hooks/usePollingNotifications';
import { 
    ClipboardDocumentListIcon as TotalSolid, 
    ClockIcon as ClockSolid,
    ArrowPathIcon as ProgressSolid, 
    CheckCircleIcon as DoneSolid,
    ExclamationTriangleIcon as WarningSolid, 
} from '@heroicons/react/24/solid';
import { useAuth } from '../services/AuthContext';

const MainLayout = () => {
  const [headerData, setHeaderData] = useState({ title: '', subtitle: '' });
  const location = useLocation();
  const navigate = useNavigate();
  // Lấy user + logout từ AuthContext
  const { user, logout } = useAuth();

  useEffect(() => {
    const path = location.pathname;
  
    // ----- My Tasks -----
    if (path === '/tasks') {
      setHeaderData({
        title: 'My Tasks',
        subtitle: 'Manage and track your assigned tasks across all projects',
      });
    }
    // ----- Task Detail (user) -----
    else if (path.startsWith('/tasks/')) {
      setHeaderData({
        title: 'Task detail',
        subtitle: 'View and manage the details of this task',
      });
    }
    // ----- Calendar -----
    else if (path === '/calendar') {
      setHeaderData({
        title: 'Calendar',
        subtitle: 'View meetings and events by day',
      });
    }
    // ----- Members -----
    else if (path === '/members') {
      setHeaderData({
        title: 'Team members',
        subtitle: 'Mange your projects team members and their roles',
      });
    }
    // ----- Projects -----
    else if (path === '/projects') {
      setHeaderData({
        title: 'Test Workspace',
        subtitle: 'Manage all projects and their collaboration',
      });
    }
    // ----- Notifications -----
    else if (path === '/notifications') {
      setHeaderData({
        title: 'Notifications',
        subtitle: 'View recent updates and mentions across your projects',
      });
    }
    // ----- Settings -----
    else if (path === '/settings') {
      setHeaderData({
        title: 'Profile Settings',
        subtitle: 'Manage your account information and preferences',
      });
    }
    // ----- Dashboard (home & mọi path khác) -----
    else {
      setHeaderData({
        title: 'Dashboard',
        subtitle: 'Welcome to your dashboard',
      });
    }
  }, [location.pathname]);
  
  const [tasks, setTasks] = useState(mockKanbanTasks);

  // -- Summary cho MyTasks --
  const totalCount = tasks.length;
  const todoCount = tasks.filter(t => t.status === 'Todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const dueSoonCount = tasks.filter(t => t.dueSoon === true).length;

  const dynamicTasksSummary = [
    { number: totalCount, label: 'Total', icon: <TotalSolid />, iconColor: "text-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-800" },
    { number: todoCount, label: 'Todo', icon: <ClockSolid />, iconColor: "text-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-600" },
    { number: inProgressCount, label: 'In Progress', icon: <ProgressSolid />, iconColor: "text-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-600" },
    { number: doneCount, label: 'Done', icon: <DoneSolid />, iconColor: "text-green-500", bgColor: "bg-green-100", textColor: "text-green-600" },
    { number: dueSoonCount, label: '1 day left', icon: <WarningSolid />, iconColor: "text-orange-500", bgColor: "bg-orange-100", textColor: "text-orange-600" },
  ];

  
  // Gọi hook polling 
  const { unreadCount } = usePollingNotifications(30000); 

  // Hàm Logout
  const handleLogout = () => {
    logout();
    navigate('/login'); // Chuyển về trang login
  };

  return (
    <>
      <div className='flex h-screen'>
        <SideBar unreadCount={unreadCount} />
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
          
          {/* Navbar sẽ nhận props từ state */}
          <Navbar 
            title={headerData.title} 
            subtitle={headerData.subtitle}
            unreadCount={unreadCount}
            user={user}
            onLogout={handleLogout}
            
          />

          {/* Sửa <main> để nó tự động nhận padding từ trang con */}
          <main className='flex-1'>
            {/*  Truyền data xuống */}
            <Outlet context={{ 
              tasks, 
              setTasks, 
              dynamicTasksSummary
            }} /> 
          </main>
        </div>
      </div>
    </>
  );
}

export default MainLayout;