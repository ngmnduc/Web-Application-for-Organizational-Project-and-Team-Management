import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { ArrowLeft, Check, Crown } from 'lucide-react';

import logoIcon from '../assets/images/logo.png'; 
import logoText from '../assets/images/syncora-official.png'; 

export default function PricingPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('Free'); // Mặc định chọn Free 

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  // --- LOGIC CHỌN GÓI ADMIN ---
  const handleAdminUpgrade = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Trường hợp hy hữu mất token -> về login
        navigate('/login'); 
        return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/payment/session', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url; 
      } else {
        alert(data.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      alert('Connection error');
    }
  };

  // --- LOGIC CHỌN GÓI FREE ---
  const handleFreePlan = () => {
      // Người dùng đã login từ bước Sign Up rồi
      // Chuyển hướng thẳng vào Dashboard của Member
      navigate('/home'); 
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-80 h-80 bg-orange-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-40 -left-40 w-96 h-96 bg-orange-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        {/* --- LOGO: Icon + Chữ --- */}
        <div className="flex items-center gap-2 group cursor-pointer">
          {/* Logo Biểu tượng */}
            <img 
              src={logoIcon} 
              alt="Logo Icon" 
              className="w-14 h-14 object-contain transition-transform group-hover:scale-105" 
            />
  
          {/* Logo Chữ */}
            <img 
              src={logoText} 
              alt="Syncora Text" 
              className="h-8 object-contain transition-transform group-hover:scale-105" 
            />
          </div>

      </nav>

      {/* Pricing Content */}
      <div className="relative z-10 container mx-auto px-6 py-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl mb-6 bg-gradient-to-r from-white via-orange-100 to-orange-500 bg-clip-text text-transparent font-extrabold">
              Select Your Workspace Plan
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              You're almost there! Choose a plan to start organizing your projects.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* --- FREE PLAN --- */}
            <div 
              onClick={() => handleSelectPlan('Free')}
              className={`
                bg-zinc-900 rounded-2xl border-2 p-8 transition-all duration-300 cursor-pointer
                ${selectedPlan === 'Free' 
                  ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)] scale-[1.02]' 
                  : 'border-zinc-800 hover:border-orange-500/50'}
              `}
            >
              <div className="mb-6">
                <h3 className="text-2xl mb-2 font-bold">Free Plan</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl text-orange-500 font-bold">$0</span>
                  <span className="text-gray-400">/forever</span>
                </div>
                <p className="text-gray-400">
                  Perfect for individuals getting started.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {['Create 1 project', 'Basic task management', 'Up to 3 team members', 'Community support'].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-orange-500" />
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Nút Start Free -> Vào thẳng Home */}
              <button 
                onClick={handleFreePlan}
                className="block w-full py-3 px-6 bg-zinc-800 text-white text-center rounded-lg hover:bg-zinc-700 transition-all duration-300 border border-zinc-700 font-bold"
              >
                Continue with Free
              </button>
            </div>

            {/* --- ADMIN PLAN --- */}
            <div 
              onClick={() => handleSelectPlan('Admin')}
              className={`
                bg-gradient-to-b from-orange-500/10 to-zinc-900 rounded-2xl border-2 p-8 relative transition-all duration-300 cursor-pointer
                ${selectedPlan === 'Admin' 
                  ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-[1.02]' 
                  : 'border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20'}
              `}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-orange-500 text-black px-4 py-1 rounded-full text-sm flex items-center gap-1 font-bold shadow-lg">
                  <Crown className="w-4 h-4" />
                  Most Popular
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl mb-2 font-bold">Admin Plan</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl text-orange-500 font-bold">$20</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-gray-400">
                  Unlock full power for your team.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {['Unlimited projects', 'Full admin control panel', 'Unlimited team members', 'Advanced analytics'].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-white">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleAdminUpgrade}
                className="w-full py-3 px-6 bg-orange-500 text-black rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-lg shadow-orange-500/50 font-bold"
              >
                Get Admin Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}