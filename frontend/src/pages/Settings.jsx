import React, { useState, useEffect, useRef } from 'react';
import { 
    UserIcon, KeyIcon, SunIcon, GlobeAltIcon, 
    PhotoIcon, CameraIcon, TrashIcon, ArrowPathIcon, 
    XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon,
    ShieldCheckIcon, LockClosedIcon, FingerPrintIcon, MoonIcon,
    CreditCardIcon, CalendarDaysIcon, BanknotesIcon 
} from '@heroicons/react/24/outline'; 
import { useAuth } from '../services/AuthContext';
import { 
    cancelSubscription, 
    resumeSubscription, 
    getPortalUrl, 
    refreshProfile 
} from '../services/authService';

const PRIMARY_COLOR = 'var(--color-brand)'; 
const API_BASE_URL = 'http://localhost:4000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// --- COMPONENT: ALERT WARNING (Dành cho Subscription) ---
const AlertWarning = ({ organization }) => {
    if (!organization) return null;
    const { subscriptionStatus, plan, subscriptionExpiredAt } = organization;
    
    if (subscriptionStatus === 'PAST_DUE') {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm animate-fade-in-down">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Payment Failed</h3>
                        <p className="mt-2 text-sm text-red-700">We were unable to charge for your Premium renewal. Please update your payment card.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (subscriptionStatus === 'CANCELLED' && plan === 'PREMIUM' && subscriptionExpiredAt) {
        const daysLeft = Math.ceil((new Date(subscriptionExpiredAt) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3 && daysLeft >= 0) {
            return (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm animate-fade-in-down">
                    <div className="flex">
                        <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Premium Plan Expiring Soon</h3>
                            <p className="mt-2 text-sm text-yellow-700">Your plan will expire in {daysLeft} days. Resume renewal now to keep your benefits.</p>
                        </div>
                    </div>
                </div>
            );
        }
    }
    return null;
};

// --- COMPONENT: NOTIFICATION BANNER ---
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
            <button onClick={onClose} className="ml-4 hover:bg-black/5 rounded-full p-1">
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

// --- COMPONENT: CONFIRM MODAL ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", confirmColor = "bg-red-600" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmColor.includes('red') ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                        <TrashIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Cancel</button>
                        <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium hover:opacity-90 transition shadow-md ${confirmColor}`}>{confirmText}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: IMAGE CROPPER ---
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Adjust Photo</h3>
                    <button onClick={onCancel}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
                </div>
                <div className="p-6 flex flex-col items-center">
                    <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-gray-100 cursor-move bg-gray-50" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                        <img ref={imageRef} src={imageSrc} alt="Crop" className="absolute max-w-none origin-center pointer-events-none" style={{ width: '100%', top: '50%', left: '50%', transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }} />
                    </div>
                    <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full mt-6 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"/>
                </div>
                <div className="p-4 bg-gray-50 border-t flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
                    <button onClick={handleCrop} className="px-6 py-2 text-sm font-bold text-white rounded-lg bg-[var(--color-brand)]">Save Photo</button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: PROFILE INFO (Lấy từ Settings1) ---
const ProfileInfo = () => {
    const { user, setUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [showCropModal, setShowCropModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({ name: '', phoneNumber: '', avatar: '' });

    useEffect(() => { if (user) setFormData({ name: user.name || '', phoneNumber: user.phoneNumber || '', avatar: user.avatar || '' }); }, [user]);

    const showNotification = (message, type = 'success') => setNotification({ message, type });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => { setTempImage(reader.result); setShowCropModal(true); event.target.value = ''; };
            reader.readAsDataURL(file);
        }
    };

    const handleCropSave = (croppedBase64) => { setFormData(prev => ({ ...prev, avatar: croppedBase64 })); setShowCropModal(false); showNotification("Photo ready! Click 'Save Changes' to apply."); };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ fullName: formData.name, phoneNumber: formData.phoneNumber, avatar: formData.avatar })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            const updatedUser = { ...user, ...data.data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            showNotification('Profile updated successfully!');
        } catch (error) { showNotification(error.message, 'error'); } finally { setIsLoading(false); }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border relative">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            {showCropModal && <ImageCropperModal imageSrc={tempImage} onCancel={() => setShowCropModal(false)} onSave={handleCropSave} />}
            <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => { setFormData(prev => ({ ...prev, avatar: '' })); setShowDeleteConfirm(false); }} title="Remove Photo" message="Confirm removal of profile picture?" />
            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
            <div className="flex items-center space-x-6 mb-8">
                <div className="relative group w-24 h-24 rounded-full overflow-hidden border-4 cursor-pointer bg-gray-200" onClick={() => fileInputRef.current.click()}>
                    <img src={formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                <button onClick={() => fileInputRef.current.click()} className="text-sm font-bold" style={{ color: PRIMARY_COLOR }}>Change Photo</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" id="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="p-2 border rounded-lg focus:ring-1 focus:ring-[var(--color-brand)] outline-none"/>
                <input type="email" value={user?.email || ''} className="p-2 border bg-gray-50 rounded-lg cursor-not-allowed" disabled />
                <input type="text" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" className="p-2 border rounded-lg focus:ring-1 focus:ring-[var(--color-brand)] outline-none"/>
                <input type="text" value={user?.role || 'Member'} className="p-2 border bg-gray-50 rounded-lg cursor-not-allowed" disabled />
            </div>
            <div className="mt-8 flex justify-end">
                <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 text-white font-semibold rounded-lg bg-[var(--color-brand)]">{isLoading ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </div>
    );
};

// --- COMPONENT: BILLING SECTION (Mày vừa làm) ---
const BillingSection = ({ organization, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });

    const plan = organization?.plan ? organization.plan.toUpperCase() : "FREE";
    const status = organization?.subscriptionStatus ? organization.subscriptionStatus.toUpperCase() : "INACTIVE";
    const isPremium = plan === "PREMIUM" || plan === "ADMIN"; 

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };
    
    const expiredAt = formatDate(organization?.subscriptionExpiredAt);

    const handleAction = async () => {
        setLoading(true);
        try {
            if (modalConfig.type === 'cancel') await cancelSubscription();
            else if (modalConfig.type === 'resume') await resumeSubscription();
            await onRefresh();
        } catch (error) { alert(error.message); } finally { setLoading(false); setModalConfig({ isOpen: false, type: null }); }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden mt-8">
            <ConfirmModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} onConfirm={handleAction} title={modalConfig.type === 'cancel' ? "Cancel Renewal?" : "Resume Subscription?"} message="Are you sure?" confirmText="Confirm" confirmColor={modalConfig.type === 'cancel' ? "bg-red-600" : "bg-green-600"} />
            <div className="p-6 border-b bg-gray-50/50 flex items-start gap-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><BanknotesIcon className="w-8 h-8" /></div>
                <div><h2 className="text-xl font-bold">Billing Information</h2><p className="text-sm text-gray-500">Manage your subscription.</p></div>
            </div>
            <div className="p-6">
                <div className="border rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-2 flex-1">
                        <div className="text-sm font-medium">Plan: <span className="uppercase font-bold">{plan}</span> ({status})</div>
                        <div className="text-3xl font-extrabold">{isPremium ? "$20 / Month" : "Free"}</div>
                        {isPremium && <div className="text-sm text-gray-600">Renewal/Expiry: {expiredAt}</div>}
                    </div>
                    <div className="flex gap-3">
                        {!isPremium && <button onClick={() => window.location.href = '/pricing'} className="px-5 py-2.5 bg-black text-white rounded-xl">Upgrade</button>}
                        {isPremium && status === 'ACTIVE' && <button onClick={() => setModalConfig({ isOpen: true, type: 'cancel' })} className="text-red-600 border px-4 py-2 rounded-xl">Cancel Renewal</button>}
                        {isPremium && status === 'CANCELLED' && <button onClick={() => setModalConfig({ isOpen: true, type: 'resume' })} className="bg-green-600 text-white px-5 py-2.5 rounded-xl">Resume</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: ACCOUNT SETTINGS (Password + Billing) ---
const AccountSettings = ({ organization, onRefresh }) => {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdatePassword = async () => {
        if (!passwords.currentPassword) return setNotification({ message: 'Current password required', type: 'error' });
        if (passwords.newPassword !== passwords.confirmPassword) return setNotification({ message: 'Passwords mismatch', type: 'error' });
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) });
            if (!res.ok) throw new Error('Failed');
            setNotification({ message: 'Password updated!', type: 'success' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) { setNotification({ message: error.message, type: 'error' }); } finally { setIsLoading(false); }
    };

    return (
        <div className="space-y-8">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50 flex gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ShieldCheckIcon className="w-8 h-8" /></div>
                    <div><h2 className="text-xl font-bold">Security</h2><p className="text-sm text-gray-500">Secure your account.</p></div>
                </div>
                <div className="p-6 space-y-6">
                    <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} placeholder="Current Password" className="w-full p-2 border rounded-lg"/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="password" name="newPassword" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} placeholder="New Password" className="p-2 border rounded-lg"/>
                        <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} placeholder="Confirm Password" className="p-2 border rounded-lg"/>
                    </div>
                    <div className="flex justify-end"><button onClick={handleUpdatePassword} disabled={isLoading} className="px-6 py-2 bg-black text-white rounded-lg">Update Password</button></div>
                </div>
            </div>
            <BillingSection organization={organization} onRefresh={onRefresh} />
        </div>
    );
};

// --- COMPONENT: PREFERENCES (Lấy từ Settings1) ---
const Preferences = () => {
    const [theme, setTheme] = useState('Light');
    const [language, setLanguage] = useState('English');
    const [notificationPrefs, setNotificationPrefs] = useState([
        { id: 'taskAssigned', label: 'Task assigned', description: 'Notify when assigned', enabled: true },
        { id: 'mentioned', label: 'Mentioned', description: 'Notify when mentioned', enabled: true }
    ]);
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-semibold mb-6">Preferences</h2>
            <div className="mb-8 pb-6 border-b">
                <h3 className="font-medium mb-3">Appearance</h3>
                <div className="flex space-x-3">
                    <button onClick={() => setTheme('Light')} className={`px-4 py-2 rounded-lg border ${theme === 'Light' ? 'border-black' : ''}`}>Light</button>
                    <button onClick={() => setTheme('Dark')} className={`px-4 py-2 rounded-lg border ${theme === 'Dark' ? 'border-black' : ''}`}>Dark</button>
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-medium">Notifications</h3>
                {notificationPrefs.map(pref => (
                    <div key={pref.id} className="flex justify-between items-center border-b pb-2">
                        <div><p className="font-medium">{pref.label}</p><p className="text-sm text-gray-500">{pref.description}</p></div>
                        <input type="checkbox" checked={pref.enabled} onChange={() => {}} className="h-5 w-5" style={{ accentColor: PRIMARY_COLOR }} />
                    </div>
                ))}
            </div>
            <button className="mt-8 px-6 py-2 text-white rounded-lg bg-[var(--color-brand)]">Save All</button>
        </div>
    );
};

const TabButton = ({ label, activeTab, onClick }) => (
    <button className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === label ? 'text-gray-900 border-b-2 font-semibold' : 'text-gray-500'}`} style={activeTab === label ? { borderColor: PRIMARY_COLOR } : { borderColor: 'transparent' }} onClick={() => onClick(label)}>{label}</button>
);

const Settings = () => {
    const [activeTab, setActiveTab] = useState('Profile Info');
    const { setUser } = useAuth();
    const [organization, setOrganization] = useState(() => JSON.parse(localStorage.getItem('organization')));

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
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto"> 
                <AlertWarning organization={organization} />
                <div className="flex space-x-6 border-b border-gray-200 mb-8">
                    <TabButton label="Profile Info" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton label="Account Settings" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton label="Preferences" activeTab={activeTab} onClick={setActiveTab} />
                </div>
                {renderContent()}
            </div>
        </div>
    );
}

export default Settings;