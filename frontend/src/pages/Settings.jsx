import React, { useState, useEffect, useRef } from 'react';
import { 
    CameraIcon, 
    XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon,
    ShieldCheckIcon,
    CreditCardIcon, CalendarDaysIcon, BanknotesIcon, SunIcon, MoonIcon, TrashIcon
} from '@heroicons/react/24/outline'; 
import { useAuth } from '../services/AuthContext';
import { 
    cancelSubscription, 
    resumeSubscription, 
    getPortalUrl, 
    refreshProfile 
} from '../services/authService';
import { useTheme } from '../context/ThemeContext';

import { API_BASE_URL } from '../utils/constants';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

//  COMPONENT: ALERT WARNING 
const AlertWarning = ({ organization }) => {
    if (!organization) return null;
    const { subscriptionStatus, plan, subscriptionExpiredAt } = organization;
    
    if (subscriptionStatus === 'PAST_DUE') {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm animate-fade-in-down">
                <div className="flex">
                    <div className="flex-shrink-0"><ExclamationTriangleIcon className="h-5 w-5 text-red-500" /></div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Payment Failed</h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                            <p>We were unable to charge for your Premium renewal. Please update your payment card immediately.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

//  COMPONENT: NOTIFICATION BANNER 
const NotificationBanner = ({ message, type, onClose }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className={`fixed top-24 right-5 z-[100] flex items-center p-4 mb-4 rounded-lg shadow-lg border animate-fade-in-down ${isSuccess ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {isSuccess ? <CheckCircleIcon className="w-5 h-5 mr-3" /> : <ExclamationCircleIcon className="w-5 h-5 mr-3" />}
            <div className="text-sm font-medium">{message}</div>
            <button onClick={onClose} className="ml-4 hover:bg-black/5 rounded-full p-1"><XMarkIcon className="w-4 h-4" /></button>
        </div>
    );
};

//  COMPONENT: CONFIRM MODAL 
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmColor = "bg-red-600" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmColor.includes('red') ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition">Cancel</button>
                        <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium hover:opacity-90 transition shadow-md ${confirmColor}`}>{confirmText}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

//  COMPONENT: IMAGE CROPPER 
const ImageCropperModal = ({ imageSrc, onCancel, onSave }) => {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    const handleMouseDown = (e) => { setIsDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); };
    const handleMouseMove = (e) => { if (!isDragging) return; setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
    const handleMouseUp = () => setIsDragging(false);

    const handleCrop = () => {
        const canvas = document.createElement('canvas');
        const size = 300; canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;
        const displaySize = 256; 
        const scaleFactor = size / displaySize;
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, size, size);
        ctx.translate(size / 2, size / 2); ctx.scale(zoom, zoom); ctx.translate(-size / 2, -size / 2);
        ctx.drawImage(img, (offset.x * scaleFactor) + (size - size) / 2, (offset.y * scaleFactor) + (size - (img.height * (size/img.width))) / 2, size, img.height * (size / img.width));
        onSave(canvas.toDataURL('image/jpeg', 0.9));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-zinc-800">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white">Adjust Photo</h3>
                    <button onClick={onCancel}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="p-6 flex flex-col items-center bg-white dark:bg-zinc-900">
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-gray-100 dark:border-zinc-700 cursor-move bg-gray-50 dark:bg-zinc-800" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                        <img ref={imageRef} src={imageSrc} alt="Crop" className="absolute max-w-none origin-center pointer-events-none" style={{ width: '100%', top: '50%', left: '50%', transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }} />
                    </div>
                    <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full mt-6 h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"/>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-800 flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg">Cancel</button>
                    <button onClick={handleCrop} className="px-6 py-2 text-sm font-bold text-white rounded-lg bg-[var(--color-brand)]">Save Photo</button>
                </div>
            </div>
        </div>
    );
};

// COMPONENT: PROFILE INFO
const ProfileInfo = () => {
    const { user, setUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    // UI States
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [showCropModal, setShowCropModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({ name: '', phoneNumber: '', avatar: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
                avatar: user.avatar || ''
            });
        }
    }, [user]);

    const showNotification = (message, type = 'success') => setNotification({ message, type });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));

    // Chọn file
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { showNotification('Image size must be less than 5MB', 'error'); return; }
            if (!file.type.startsWith('image/')) { showNotification('Please select a valid image file', 'error'); return; }
            const reader = new FileReader();
            reader.onload = () => { setTempImage(reader.result); setShowCropModal(true); event.target.value = ''; };
            reader.readAsDataURL(file);
        }
    };

    // Lưu ảnh crop
    const handleCropSave = (croppedBase64) => {
        setFormData(prev => ({ ...prev, avatar: croppedBase64 }));
        setShowCropModal(false);
        setTempImage(null);
        showNotification("Photo ready! Click 'Save Changes' to apply.", "success");
    };

    // Xóa ảnh
    const confirmDeleteAvatar = () => {
        setFormData(prev => ({ ...prev, avatar: '' }));
        setShowDeleteConfirm(false);
        showNotification("Photo removed. Click 'Save Changes' to apply.", "success");
    };

    // Update Profile & Sync Navbar
    const handleSave = async () => {
        setIsLoading(true);
        try {
            const payload = {
                fullName: formData.name, 
                phoneNumber: formData.phoneNumber,
                avatar: formData.avatar 
            };

            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to update profile');

            if (data.data) {
                const updatedUser = { ...user, ...data.data };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            showNotification(error.message || "Update failed", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // 👇 Thêm dark:bg-zinc-900 dark:border-zinc-800 cho khung
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 relative transition-colors duration-200">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            
            {showCropModal && <ImageCropperModal imageSrc={tempImage} onCancel={() => { setShowCropModal(false); setTempImage(null); }} onSave={handleCropSave} />}
            
            <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDeleteAvatar} title="Remove Profile Picture" message="Are you sure you want to remove your profile picture?" />

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>
            
            <div className="flex items-center space-x-6 mb-8">
                {/* Avatar Display */}
                <div className="relative group">
                    <div 
                        className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-zinc-700 shadow-md cursor-pointer bg-gray-200 dark:bg-zinc-800"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <img 
                            src={formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`}
                            alt="Profile" 
                            className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`; }} 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <CameraIcon className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* 👇 Nút thùng rác bé bé ở góc trên (Có hỗ trợ Dark Mode) */}
                    {formData.avatar && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                            className="absolute -top-1 -right-1 p-1.5 bg-white dark:bg-zinc-800 text-red-500 rounded-full shadow-md border border-gray-100 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors z-10"
                            title="Remove photo"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/png, image/jpeg, image/jpg" className="hidden" />
                </div>
                
                <div className="flex flex-col">
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="text-sm font-bold hover:underline text-left text-[var(--color-brand)]"
                    >
                        Change Photo
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG or GIF. Max 5MB.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg shadow-sm focus:ring-1 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] transition outline-none"/>
                </div>

                {/* Email Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input type="email" value={user?.email || ''} className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-lg shadow-sm cursor-not-allowed" disabled />
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                {/* Phone Number */}
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input type="text" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+84 123 456 789" className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg shadow-sm focus:ring-1 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] transition outline-none"/>
                </div>

                {/* Role */}    
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <input type="text" value={user?.role || 'Member'} className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-lg shadow-sm cursor-not-allowed" disabled />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
                <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition flex items-center bg-[var(--color-brand)]">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

//  COMPONENT: BILLING SECTION 
const BillingSection = ({ organization, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });

    const plan = organization?.plan ? organization.plan.toUpperCase() : "FREE";
    const status = organization?.subscriptionStatus ? organization.subscriptionStatus.toUpperCase() : "INACTIVE";
    const isPremium = plan === "PREMIUM" || plan === "ADMIN"; 
    const expiredAt = organization?.subscriptionExpiredAt ? new Date(organization.subscriptionExpiredAt).toLocaleDateString() : "N/A";

    const handleAction = async () => {
        setLoading(true);
        try {
            if (modalConfig.type === 'cancel') await cancelSubscription();
            else if (modalConfig.type === 'resume') await resumeSubscription();
            await onRefresh();
        } catch (error) { alert(error.message || "Action failed"); } 
        finally { setLoading(false); setModalConfig({ isOpen: false, type: null }); }
    };

    const handleUpdateCard = async () => {
        setLoading(true);
        try {
            const data = await getPortalUrl();
            if (data.url) window.location.href = data.url;
        } catch (error) { alert("Failed to get portal link: " + error.message); setLoading(false); }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 overflow-hidden relative mt-8 transition-colors duration-200">
            <ConfirmModal 
                isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} onConfirm={handleAction}
                title={modalConfig.type === 'cancel' ? "Cancel Premium Plan?" : "Resume Subscription?"}
                message={modalConfig.type === 'cancel' ? `Confirm cancel? Benefits end on ${expiredAt}.` : "Confirm resume?"}
                confirmText={modalConfig.type === 'cancel' ? "Confirm Cancel" : "Resume Now"}
                confirmColor={modalConfig.type === 'cancel' ? "bg-red-600" : "bg-green-600"}
            />

            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 flex items-start gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400"><BanknotesIcon className="w-8 h-8" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing Information</h2><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage subscription & payments.</p></div>
            </div>

            <div className="p-6 sm:p-8">
                <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                    <div className="space-y-2 flex-1 w-full">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Plan: <span className="uppercase font-bold text-gray-900 dark:text-white">{plan}</span></div>
                        <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{isPremium ? "$20 / Month" : "Free"}</div>
                        {isPremium && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><CalendarDaysIcon className="w-4 h-4" /><span>Expiry: <span className="font-semibold">{expiredAt}</span></span></div>}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {!isPremium && (
                            <button onClick={() => window.location.href = '/pricing'} className="px-6 py-2 text-white font-semibold rounded-lg bg-[var(--color-brand)] flex items-center justify-center gap-2">
                                <CreditCardIcon className="w-4 h-4"/> Upgrade to Premium
                            </button>
                        )}
                        {isPremium && status === 'ACTIVE' && (
                            <button onClick={() => setModalConfig({ isOpen: true, type: 'cancel' })} className="px-4 py-2.5 bg-white border border-gray-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition">
                                Cancel Renewal
                            </button>
                        )}
                        {isPremium && status === 'CANCELLED' && (
                            <button onClick={() => setModalConfig({ isOpen: true, type: 'resume' })} className="px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition">
                                Resume Subscription
                            </button>
                        )}
                        {isPremium && status === 'PAST_DUE' && (
                            <button onClick={handleUpdateCard} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
                                Update Card
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

//  COMPONENT: ACCOUNT SETTINGS 
const AccountSettings = ({ organization, onRefresh }) => {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const showNotification = (message, type = 'success') => setNotification({ message, type });

    const handleUpdatePassword = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify(passwords)
            });
            if (!res.ok) throw new Error('Failed to update password');
            showNotification('Password updated successfully!', 'success');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) { showNotification(error.message, 'error'); } finally { setIsLoading(false); }
    };

    return (
        <div className="space-y-8">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            
            {/* Security Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 overflow-hidden transition-colors duration-200">
                <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 flex gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><ShieldCheckIcon className="w-8 h-8" /></div>
                    <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Security</h2><p className="text-sm text-gray-500 dark:text-gray-400">Secure your account.</p></div>
                </div>
                <div className="p-6 space-y-6">
                    <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} placeholder="Current Password" 
                        className="w-full p-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} placeholder="New Password" 
                            className="p-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
                        />
                        <input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} placeholder="Confirm Password" 
                            className="p-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white rounded-lg outline-none focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleUpdatePassword} disabled={isLoading} className="px-6 py-2 text-white font-semibold rounded-lg bg-[var(--color-brand)] hover:opacity-90 shadow-md">Update Password</button>
                    </div>
                </div>
            </div>
            
            <BillingSection organization={organization} onRefresh={onRefresh} />
        </div>
    );
};

//  COMPONENT: PREFERENCES 
const Preferences = () => {
    const { user, setUser } = useAuth();
    const { theme, toggleTheme } = useTheme(); 
    
    // State Notification
    const [prefs, setPrefs] = useState({
        enabled: user?.preferences?.notifications?.enabled ?? true,
        taskAssigned: user?.preferences?.notifications?.taskAssigned ?? true,
        mentioned: user?.preferences?.notifications?.mentioned ?? true,
        memberJoined: user?.preferences?.notifications?.memberJoined ?? true,
        meetingCreated: user?.preferences?.notifications?.meetingCreated ?? true
    });

    // Auto-save logic
    const updateNotiPrefs = async (newPrefs) => {
        try {
            const updatedUser = { 
                ...user, 
                preferences: { ...user.preferences, notifications: newPrefs } 
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            await fetch(`${API_BASE_URL}/users/preferences`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ notifications: newPrefs })
            });
        } catch (error) { console.error(error); }
    };

    const handleToggle = (key) => {
        let newPrefs;
        if (key === 'enabled') {
            newPrefs = { ...prefs, enabled: !prefs.enabled };
        } else {
            newPrefs = { ...prefs, [key]: !prefs[key] };
        }
        setPrefs(newPrefs);
        updateNotiPrefs(newPrefs);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 transition-colors duration-200">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Preferences</h2>
            
            {/* THEME */}
            <div className="mb-8 pb-6 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Interface Theme</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select your preferred appearance</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                        <button onClick={() => toggleTheme('Light')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${theme === 'Light' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}><SunIcon className="w-4 h-4" /> Light</button>
                        <button onClick={() => toggleTheme('Dark')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${theme === 'Dark' ? 'bg-zinc-700 text-white shadow-sm ring-1 ring-black' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}><MoonIcon className="w-4 h-4" /> Dark</button>
                    </div>
                </div>
            </div>

            {/* NOTIFICATIONS */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div><h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Notifications</h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage all notifications</p></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={prefs.enabled} onChange={() => handleToggle('enabled')} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-brand)]"></div>
                    </label>
                </div>
                <div className={`space-y-3 transition-all duration-300 overflow-hidden ${prefs.enabled ? 'opacity-100 max-h-[500px]' : 'opacity-40 max-h-0 pointer-events-none grayscale'}`}>
                    {[{ key: 'taskAssigned', label: 'Task Assignments' }, { key: 'mentioned', label: 'Mentions' }, { key: 'memberJoined', label: 'New Members' }, { key: 'meetingCreated', label: 'New Meetings' }].map((item) => (
                        <div key={item.key} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800 last:border-0 pl-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{item.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={prefs[item.key]} onChange={() => handleToggle(item.key)} className="sr-only peer" disabled={!prefs.enabled} />
                                <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ label, activeTab, onClick }) => (
    <button
        className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === label ? 'text-gray-900 dark:text-white border-b-2 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
        style={activeTab === label ? { borderColor: 'var(--color-brand)' } : { borderColor: 'transparent' }}
        onClick={() => onClick(label)}
    >
        {label}
    </button>
);

const Settings = () => {
    const { user, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState('Profile Info');
    const [organization, setOrganization] = useState(() => {
        const savedOrg = localStorage.getItem('organization');
        return savedOrg ? JSON.parse(savedOrg) : null;
    });

    const syncData = async () => {
        try {
            const data = await refreshProfile();
            if (data) { setUser(data.user); setOrganization(data.organization); }
        } catch (err) { console.error("Sync failed:", err); }
    };

    useEffect(() => { syncData(); }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'Profile Info': return <ProfileInfo />;
            case 'Account Settings': return <AccountSettings organization={organization} onRefresh={syncData} />;
            case 'Preferences': return <Preferences />;
            default: return <ProfileInfo />;
        }
    };
    
    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 dark:bg-black min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <div className="max-w-4xl mx-auto"> 
                <AlertWarning organization={organization} />
                
                <div className="flex space-x-6 border-b border-gray-200 dark:border-zinc-800 mb-8 overflow-x-auto">
                    {['Profile Info', 'Account Settings', 'Preferences'].map(tab => (
                        <TabButton key={tab} label={tab} activeTab={activeTab} onClick={setActiveTab} />
                    ))}
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default Settings;