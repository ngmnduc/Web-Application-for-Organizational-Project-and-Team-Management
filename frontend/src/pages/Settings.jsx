import React, { useState, useEffect, useRef } from 'react';
import { 
    UserIcon, KeyIcon, SunIcon, GlobeAltIcon, 
    PhotoIcon, CameraIcon, TrashIcon, ArrowPathIcon, 
    XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon,
    ShieldCheckIcon, LockClosedIcon, FingerPrintIcon, MoonIcon
} from '@heroicons/react/24/outline'; 
import { useAuth } from '../services/AuthContext';

const PRIMARY_COLOR = 'var(--color-brand)'; 
const API_BASE_URL = 'http://localhost:4000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
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
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <TrashIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition shadow-md">
                            Delete
                        </button>
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

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleCrop = () => {
        const canvas = document.createElement('canvas');
        const size = 300; 
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;
        const displaySize = 256; 
        const scaleFactor = size / displaySize;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.translate(size / 2, size / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-size / 2, -size / 2);
        ctx.drawImage(
            img, 
            (offset.x * scaleFactor) + (size - (img.width * (size/img.width))) / 2,
            (offset.y * scaleFactor) + (size - (img.height * (size/img.width))) / 2,
            size, 
            img.height * (size / img.width)
        );

        onSave(canvas.toDataURL('image/jpeg', 0.9));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Adjust Photo</h3>
                    <button onClick={onCancel}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="p-6 flex flex-col items-center">
                    <div 
                        className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-gray-100 shadow-inner cursor-move bg-gray-50"
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                        onTouchStart={(e) => handleMouseDown(e.touches[0])} onTouchMove={(e) => handleMouseMove(e.touches[0])} onTouchEnd={handleMouseUp}
                    >
                        <img 
                            ref={imageRef} src={imageSrc} alt="Crop" 
                            className="absolute max-w-none origin-center pointer-events-none select-none"
                            style={{ width: '100%', top: '50%', left: '50%', transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
                            draggable={false}
                        />
                    </div>
                    <div className="w-full mt-6 px-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Zoom In</span>
                            <span>Zoom Out</span>
                        </div>
                        <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-brand)]"/>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
                    <button onClick={handleCrop} className="px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:opacity-90" style={{ backgroundColor: 'var(--color-brand)' }}>Save Photo</button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: PROFILE INFO (Đổi tên, SĐT, Avatar) ---
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
                // Merge data mới vào user hiện tại để đảm bảo đầy đủ trường
                const updatedUser = { ...user, ...data.data };
                
                // --- CẬP NHẬT CONTEXT ---
                // Điều này sẽ trigger re-render ở Navbar
                setUser(updatedUser);
                
                // Cập nhật LocalStorage để khi F5 vẫn giữ được
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
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 relative">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            
            {showCropModal && <ImageCropperModal imageSrc={tempImage} onCancel={() => { setShowCropModal(false); setTempImage(null); }} onSave={handleCropSave} />}
            
            <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDeleteAvatar} title="Remove Profile Picture" message="Are you sure you want to remove your profile picture?" />

            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
            
            <div className="flex items-center space-x-6 mb-8">
                {/* Avatar Display */}
                <div className="relative group">
                    <div 
                        className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md cursor-pointer bg-gray-200"
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

                    {formData.avatar && (
                        <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="absolute -top-1 -right-1 p-1.5 bg-white text-red-500 rounded-full shadow-md border border-gray-100 hover:bg-red-50 transition-colors z-10"
                            title="Remove photo"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}

                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/png, image/jpeg, image/jpg" className="hidden" />
                </div>
                
                <div className="flex flex-col">
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="text-sm font-bold hover:underline text-left"
                        style={{ color: 'var(--color-brand)' }}
                    >
                        Change Photo
                    </button>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 5MB.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] transition outline-none"/>
                </div>

                {/* Email Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" value={user?.email || ''} className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg shadow-sm cursor-not-allowed" disabled />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                {/* Role */}
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="text" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+84 123 456 789" className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] transition outline-none"/>
                </div>

                {/* Department */}    
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input type="text" value={user?.role || 'Member'} className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg shadow-sm cursor-not-allowed" disabled />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition flex items-center" style={{ backgroundColor: 'var(--color-brand)' }}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

// --- 5. ACCOUNT SETTINGS COMPONENT (Đổi pass) ---
const AccountSettings = () => {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const showNotification = (message, type = 'success') => setNotification({ message, type });
    const handleChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const handleUpdatePassword = async () => {
        if (!passwords.currentPassword) return showNotification('Current password is required.', 'error');
        if (passwords.newPassword !== passwords.confirmPassword) return showNotification('New passwords do not match.', 'error');
        if (passwords.newPassword.length < 6) return showNotification('Password must be at least 6 characters.', 'error');

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            
            showNotification('Password changed successfully!', 'success');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) { showNotification(error.message, 'error'); } 
        finally { setIsLoading(false); }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />

            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <ShieldCheckIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Security & Login</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your password to keep your account secure.</p>
                </div>
            </div>
            
            <div className="p-6 sm:p-8 space-y-8">
                {/* Current Password Section */}
                <div className="max-w-md">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                        <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="password" 
                            name="currentPassword" 
                            value={passwords.currentPassword} 
                            onChange={handleChange} 
                            placeholder="Enter current password" 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all outline-none text-gray-800 placeholder-gray-400"
                        />
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* New Password Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="password" 
                                name="newPassword" 
                                value={passwords.newPassword} 
                                onChange={handleChange} 
                                placeholder="Min. 6 characters" 
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all outline-none text-gray-800 placeholder-gray-400"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="password" 
                                name="confirmPassword" 
                                value={passwords.confirmPassword} 
                                onChange={handleChange} 
                                placeholder="Re-enter new password" 
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all outline-none text-gray-800 placeholder-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleUpdatePassword} 
                        disabled={isLoading} 
                        className="px-8 py-3 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all transform active:scale-95 flex items-center gap-2" 
                        style={{ backgroundColor: 'var(--color-brand)' }}
                    >
                        {isLoading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <FingerPrintIcon className="w-5 h-5" />
                                Update Password
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 6. PREFERENCES (Mock) ---
const Preferences = () => {
    const [theme, setTheme] = useState('Light');
    const [language, setLanguage] = useState('English');
    const [timezone, setTimezone] = useState('Asia/Bangkok');

    // Notification Mock Data with useReducer/useState for managing state of each preference
    const [notificationPrefs, setNotificationPrefs] = useState([
        { id: 'taskAssigned', label: 'Task assigned', description: 'Get notified when a task is assigned to you', enabled: true },
        { id: 'mentionedInComments', label: 'Mentioned in comments', description: 'Get notified when someone mentions you', enabled: true },
        { id: 'projectArchived', label: 'Project archived', description: 'Get notified when a project is archived', enabled: false },
    ]);
    
    // Function to toggle the notification preference state
    const toggleNotificationPref = (id) => {
        setNotificationPrefs(prevPrefs => 
            prevPrefs.map(pref => 
                pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
            )
        );
    };

    // Toggle Button Component
    const ToggleButton = ({ label, current, icon: Icon, onClick }) => (
        <button 
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition ${
                current === label 
                    ? 'border-gray-900 shadow-sm' 
                    : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onClick(label)}
        >
            <Icon className="w-5 h-5" style={current === label ? { color: 'var(--color-brand)' } : {}} />
            <span className="font-medium text-sm text-gray-800">{label}</span>
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferences</h2>
            
            {/* Appearance Section */}
            <div className="mb-8 pb-6 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Appearance</h3>
                <p className="text-sm text-gray-500 mb-3">Theme Mode</p>
                <div className="flex space-x-3">
                    <ToggleButton label="Light" current={theme} icon={SunIcon} onClick={setTheme} />
                    <ToggleButton label="Dark" current={theme} icon={MoonIcon} onClick={setTheme} />
                </div>
            </div>

            {/* Language & Region Section */}
            <div className="mb-8 pb-6 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Language & Region</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Language */}
                    <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <select 
                            id="language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500 transition"
                        >
                            <option>English</option>
                            <option>Vietnamese</option>
                            <option>Japanese</option>
                        </select>
                    </div>

                    {/* Timezone */}
                    <div>
                        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <div className="flex space-x-2">
                            <input 
                                type="text" 
                                id="timezone" 
                                defaultValue={timezone}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500 transition"
                            />
                            <button 
                                className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-100 border border-gray-300 transition"
                            >
                                Auto Detect
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Current timezone: {timezone}</p>
                    </div>
                </div>
            </div>

            {/* Notification Preferences Section */}
            <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Preferences</h3>
                <p className="text-sm text-gray-500 mb-4">Choose what notifications you want to receive</p>

                <div className="space-y-4">
                    {notificationPrefs.map((item) => (
                        <div 
                            key={item.id} 
                            className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-b-0"
                        >
                            <div className="flex-1">
                                <p className="font-medium text-gray-700">{item.label}</p>
                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                            <label className="relative flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={item.enabled}
                                    onChange={() => toggleNotificationPref(item.id)}
                                    className="h-5 w-5 rounded border-gray-300 focus:ring-1 focus:ring-offset-0 transition"
                                    style={{ 
                                        '--tw-ring-color': PRIMARY_COLOR, 
                                        'accentColor': PRIMARY_COLOR 
                                    }}
                                />
                                <span className="sr-only">{item.label} toggle</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                    className="px-6 py-2 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                >
                    Save All Preferences
                </button>
            </div>
        </div>
    );
};

// --- 7. TAB BUTTON ---
const TabButton = ({ label, activeTab, onClick }) => (
    <button
        className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === label ? 'text-gray-900 border-b-2 font-semibold' : 'text-gray-500 hover:text-gray-700'
        }`}
        style={activeTab === label ? { borderColor: PRIMARY_COLOR } : { borderColor: 'transparent' }}
        onClick={() => onClick(label)}
    >
        {label}
    </button>
);

// --- 8. MAIN SETTINGS ---
const Settings = () => {
    const [activeTab, setActiveTab] = useState('Profile Info');

    // Logic gọi API lấy thông tin mới nhất (GET /auth/me) khi vào trang
    const { setUser } = useAuth();
    useEffect(() => {
        fetch(`${API_BASE_URL}/auth/me`, { headers: getHeaders() })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    setUser(data.data.user);
                    localStorage.setItem('user', JSON.stringify(data.data.user));
                }
            })
            .catch(err => console.error("Sync user failed:", err));
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'Profile Info': return <ProfileInfo />;
            case 'Account Settings': return <AccountSettings />;
            case 'Preferences': return <Preferences />;
            default: return <ProfileInfo />;
        }
    };
    
    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto"> 
                {/* Tab Navigation */}
                <div className="flex space-x-6 border-b border-gray-200 mb-8">
                    <TabButton label="Profile Info" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton label="Account Settings" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton label="Preferences" activeTab={activeTab} onClick={setActiveTab} />
                </div>

                {/* Tab Content */}
                {renderContent()}
            </div>

        </div>
    );
}

export default Settings;