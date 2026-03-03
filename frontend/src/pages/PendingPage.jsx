import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, LogOut, Clock, CheckCircle2, XCircle } from 'lucide-react'; // Thêm XCircle
import { useAuth } from '../services/AuthContext'; 
import logoIcon from '../assets/images/logo.png'; 
import logoText from '../assets/images/syncora-official.png'; 
import { API_BASE_URL } from '../utils/constants';

const PendingPage = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth(); 
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected'

  // Hàm xử lý Đăng xuất
  const handleLogout = () => {
      logout();
      navigate('/');
  };

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const token = localStorage.getItem('token');
      
      // Gọi API mới tạo để hỏi chính xác trạng thái
      const response = await fetch(`${API_BASE_URL}/projects/my-status`, { // Hãy sửa URL này theo đúng route bạn định nghĩa
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();

      if (result.success && result.data) {
          const currentStatus = result.data.status; // 'PENDING', 'ACTIVE', hoặc 'REJECTED'

          if (currentStatus === 'ACTIVE') {
              setStatus('approved');
              await refreshUser(); // Cập nhật Context
              setTimeout(() => navigate('/home'), 1500); 
          } 
          else if (currentStatus === 'REJECTED') {
              // Bắt trúng trạng thái từ chối từ membership.controller.js
              setStatus('rejected');
          } 
          else {
              // Giữ nguyên trạng thái chờ
              setStatus('pending');
          }
      }
    } catch (error) {
      console.error("Failed to check status", error);
    } finally {
      setIsChecking(false);
    }
  };

  // Background decoration component
  const BackgroundGlow = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[100px] transition-colors duration-700 ${status === 'approved' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
      <div className={`absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] rounded-full opacity-10 blur-[120px] transition-colors duration-700 ${status === 'approved' ? 'bg-emerald-500' : status === 'rejected' ? 'bg-rose-500' : 'bg-yellow-500'}`}></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden font-sans">
      <BackgroundGlow />

      {/* Header - Sửa Logo thành nút bấm về Home */}
      <header className="relative z-10 w-full p-8 flex justify-between items-center">
        <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
            title="Return to Home"
        >
          <img src={logoIcon} alt="Syncora Icon" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(243,86,64,0.5)]" />
          <img src={logoText} alt="Syncora Text" className="h-6 object-contain hidden sm:block" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl shadow-2xl text-center">
          
          {/* Status Icon */}
          <div className="flex justify-center mb-8 relative">
            {status === 'approved' ? (
               <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/50 relative z-10 animate-in zoom-in duration-500">
                 <CheckCircle2 size={40} className="text-green-500" />
               </div>
            ) : status === 'rejected' ? (
               <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50 relative z-10 animate-in zoom-in duration-500">
                 <XCircle size={40} className="text-red-500" />
               </div>
            ) : (
               <>
                 <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping"></div>
                 <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/50 relative z-10">
                   <Clock size={40} className="text-orange-500" />
                 </div>
               </>
            )}
          </div>

          {/* Texts */}
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
            {status === 'approved' ? 'Access Granted!' : status === 'rejected' ? 'Access Denied' : 'Approval Pending'}
          </h2>
          
          <p className="text-gray-400 text-base mb-8 leading-relaxed px-4">
            {status === 'approved' ? (
                <>Your account has been verified. Redirecting you to the workspace...</>
            ) : status === 'rejected' ? (
                <>Your request to join the workspace has been declined by the administrator. Please contact support if you think this is a mistake.</>
            ) : (
                <>Your account has been created successfully. <br/> Please wait for a manager to approve your access.</>
            )}
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
             {status === 'pending' && (
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group">
                    <span className="text-sm text-gray-400">Status check:</span>
                    <span className="text-sm font-mono text-orange-400 flex items-center gap-2">
                        {isChecking ? <Loader2 size={14} className="animate-spin"/> : <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                        Waiting
                    </span>
                 </div>
             )}

             {/* Nút hành động chính tùy theo status */}
             {status === 'rejected' ? (
                 <button 
                    onClick={() => navigate('/')} 
                    className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-red-600 hover:bg-red-700 text-white"
                 >
                    Return to Home
                 </button>
             ) : (
                 <button 
                    onClick={checkStatus} 
                    disabled={isChecking || status === 'approved'}
                    className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                        status === 'approved' 
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                 >
                    {isChecking ? <Loader2 className="animate-spin" /> : status === 'approved' ? 'Entering...' : <> <RefreshCw size={18} /> Check Status </>}
                 </button>
             )}

             {/* Nút Đăng xuất */}
             {status !== 'approved' && (
                 <button 
                    onClick={handleLogout}
                    className="w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                 >
                    <LogOut size={18} /> Sign out
                 </button>
             )}
          </div>
        </div>

        {/* User Info (Optional - show email if logged in) */}
        {user && (
           <p className="mt-8 text-sm text-gray-500 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
             Logged in as: <strong className="text-gray-300">{user.email}</strong>
           </p>
        )}
      </main>
    </div>
  );
};

export default PendingPage;