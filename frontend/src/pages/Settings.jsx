import React, { useState } from 'react';
import { 
    ChevronDownIcon, 
    BellIcon, 
    UserIcon,
    KeyIcon,
    SunIcon,
    GlobeAltIcon,
    WrenchScrewdriverIcon,
    PhotoIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'; 
import { CheckCircleIcon as SolidCheckCircleIcon, MoonIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

const PRIMARY_COLOR = '#f35640'; 
const RED_ORANGE_BG = { backgroundColor: PRIMARY_COLOR };
const RED_ORANGE_TEXT = { color: PRIMARY_COLOR };

// ---Sub-Component: Profile Info---
const ProfileInfo = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
            
            <div className="flex items-center space-x-6 mb-8">
                {/* Avatar */}
                <div className="relative">
                    <img 
                        src="https://placehold.co/100x100/A0B9F0/ffffff?text=JS" 
                        alt="Profile Avatar" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                </div>
                {/* Upload Button */}
                <div className="flex flex-col">
                    <button className="text-sm font-medium hover:underline" style={RED_ORANGE_TEXT}>
                        Upload new
                    </button>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        id="fullName" 
                        defaultValue="John Smith"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500 transition"
                    />
                </div>
                
                {/* Email Address */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        id="email" 
                        defaultValue="john.smith@company.com"
                        className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg shadow-sm cursor-not-allowed"
                        disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Role */}
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input 
                        type="text" 
                        id="role" 
                        defaultValue="Manager"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500 transition"
                    />
                </div>

                {/* Department */}
                <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input 
                        type="text" 
                        id="department" 
                        defaultValue="Development"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500 transition"
                    />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button 
                    className="px-6 py-2 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition"
                    style={RED_ORANGE_BG}
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

// ---Sub-Component: Account Settings---
const AccountSettings = () => {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    const handleDeactivate = () => {
        console.log("Deactivation attempted. A confirmation modal should appear here."); 
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
            
            {/* Change Password Section */}
            <div className="mb-8 pb-6 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="password" 
                        placeholder="Current Password" 
                        className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500 transition"
                    />
                    <div /> {/* Spacer for grid layout */}
                    <input 
                        type="password" 
                        placeholder="New Password" 
                        className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500 transition"
                    />
                    <input 
                        type="password" 
                        placeholder="Confirm New Password" 
                        className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500 transition"
                    />
                </div>
                <button 
                    className="mt-4 px-6 py-2 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition"
                    style={RED_ORANGE_BG}
                >
                    Update Password
                </button>
            </div>
            
            {/* Danger Zone Section */}
            <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Danger Zone</h3>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-semibold text-red-800">Deactivate Account</h4>
                        <p className="text-sm text-red-700 mt-1">Your data will remain but login will be disabled. You can contact support to reactivate your account.</p>
                        <button 
                            className="mt-3 px-4 py-1.5 text-white font-semibold rounded-lg shadow-md transition bg-red-600 hover:bg-red-700"
                            onClick={handleDeactivate}
                        >
                            Deactivate Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ---Sub-Component: Preferences---
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
            <Icon className="w-5 h-5" style={current === label ? RED_ORANGE_TEXT : {}} />
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
                    style={RED_ORANGE_BG}
                >
                    Save All Preferences
                </button>
            </div>
        </div>
    );
};

// ---Main Settings Page Component---
const Settings = () => {
    const [activeTab, setActiveTab] = useState('Profile Info'); // 'Profile Info', 'Account Settings', 'Preferences'

    const renderContent = () => {
        switch (activeTab) {
            case 'Profile Info':
                return <ProfileInfo />;
            case 'Account Settings':
                return <AccountSettings />;
            case 'Preferences':
                return <Preferences />;
            default:
                return <ProfileInfo />;
        }
    };
    
    // Tab Button Component
    const TabButton = ({ label }) => (
        <button
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === label 
                    ? 'text-gray-900 border-b-2 font-semibold' 
                    : 'text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === label ? { borderColor: PRIMARY_COLOR } : { borderColor: 'transparent' }}
            onClick={() => setActiveTab(label)}
        >
            {label}
        </button>
    );

    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">

            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto"> 
                {/* Tab Navigation */}
                <div className="flex space-x-6 border-b border-gray-200 mb-8">
                    <TabButton label="Profile Info" />
                    <TabButton label="Account Settings" />
                    <TabButton label="Preferences" />
                </div>

                {/* Tab Content */}
                {renderContent()}
            </div>
            
        </div>
    );
}

export default Settings;
