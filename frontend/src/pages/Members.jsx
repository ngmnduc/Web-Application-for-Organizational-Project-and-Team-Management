import React, { useState, useEffect, useCallback } from 'react';
import { 
    MagnifyingGlassIcon,
    InformationCircleIcon, 
    FolderMinusIcon,       
    FolderPlusIcon,        
    TrashIcon,             
    XMarkIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';
import { useParams } from 'react-router-dom'; 

import { LoaderOverlay } from '../components/LoaderOverlay';
import AddMemberModal from '../components/AddMemberModal';
import AssignToProjectModal from '../components/AssignToProjectModal';

const API_BASE_URL = 'http://localhost:4000/api'; 

// --- Helper Functions ---
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
});

// --- SUB-COMPONENTS ---

// Notification Banner
const NotificationBanner = ({ message, type, onClose }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
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

// Modal Xác Nhận (Confirm)
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", isDanger = true }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                {/* Icon Header */}
                <div className={`flex items-center gap-3 mb-4 ${isDanger ? 'text-red-600' : 'text-gray-800'}`}>
                    <div className={`p-2 rounded-full ${isDanger ? 'bg-red-100' : 'bg-orange-50'}`}>
                        {isDanger ? (
                            <ExclamationTriangleIcon className="w-6 h-6" />
                        ) : (
                            <FolderMinusIcon className="w-6 h-6" style={{ color: 'var(--color-brand)' }} />
                        )}
                    </div>
                    <h3 className="text-lg font-bold">{title}</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
                
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all hover:opacity-90 ${isDanger ? 'bg-red-600' : ''}`}
                        style={!isDanger ? { backgroundColor: 'var(--color-brand)' } : {}}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal Chọn Project (Select Project)
const SelectProjectModal = ({ isOpen, onClose, user, onSelectProject }) => {
    if (!isOpen || !user) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Remove from Project</h3>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    User <strong>{user.name}</strong> is in multiple projects. Select one to remove:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {user.projects.map(proj => (
                        <button
                            key={proj._id}
                            onClick={() => onSelectProject(proj._id, proj.name)}
                            className="w-full flex justify-between items-center p-3 text-sm border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors group"
                        >
                            <span className="font-medium group-hover:text-[var(--color-brand)]">{proj.name}</span>
                            <FolderMinusIcon className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-brand)]" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Avatar
const Avatar = ({ name, avatarUrl }) => {
    if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />;
    const initials = (name || "U").split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, white)', color: 'var(--color-brand)' }}>
            {initials}
        </div>
    );
};

// Role Select 
const RoleSelect = ({ currentRole, userId, onChange, canEdit }) => {
    const getRoleStyle = (role) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Manager': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const currentStyle = getRoleStyle(currentRole);

    if (!canEdit) {
        return <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${currentStyle}`}>{currentRole}</span>;
    }

    return (
        <div className="relative inline-block">
            <select
                value={currentRole}
                onChange={(e) => onChange(userId, e.target.value)}
                className={`appearance-none cursor-pointer pl-3 pr-8 py-1 text-xs font-bold rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${currentStyle}`}
            >
                <option value="Admin" className="bg-white text-gray-900">Admin</option>
                <option value="Manager" className="bg-white text-gray-900">Manager</option>
                <option value="Member" className="bg-white text-gray-900">Member</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
            </div>
        </div>
    );
};

// User Info Modal
const UserInfoModal = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar name={user.name} avatarUrl={user.avatarUrl} />
                        <div><h3 className="text-lg font-bold text-gray-900">{user.name}</h3><p className="text-sm text-gray-500">{user.email}</p></div>
                    </div>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs font-semibold text-gray-500 uppercase mb-1">Role</p><span className="font-medium text-sm text-gray-900">{user.role}</span></div>
                        <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs font-semibold text-gray-500 uppercase mb-1">Joined</p><span className="font-medium text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span></div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Projects</p>
                        <ul className="space-y-2">
                            {user.projects?.map(p => <li key={p._id} className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-100">{p.name}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const Members = () => {
    const { id: projectId } = useParams(); 
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // States Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [currentUserRole, setCurrentUserRole] = useState('Member');

    // States cho chức năng xóa
    const [deleteUserModal, setDeleteUserModal] = useState(null); 
    const [removeProjectConfirm, setRemoveProjectConfirm] = useState(null); 
    const [selectProjectModal, setSelectProjectModal] = useState(null); 

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUserRole(JSON.parse(userStr).role || 'Member');
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const userUrl = projectId ? `${API_BASE_URL}/projects/${projectId}/members` : `${API_BASE_URL}/users`;
            const [usersRes, projectsRes] = await Promise.all([
                fetch(userUrl, { headers: getHeaders() }),
                fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() })
            ]);

            if (!usersRes.ok) throw new Error('Failed to fetch data');
            const usersResult = await usersRes.json();
            const projectsResult = await projectsRes.json();

            const userList = usersResult.data || [];
            const projectList = projectsResult.data || [];

            const mappedMembers = userList.map(user => {
                const userId = user._id || user.id || user.userId; 
                const joinedProjects = projectList.filter(proj => 
                    proj.members && proj.members.some(m => String(m.user._id || m.user) === String(userId))
                );
                return { ...user, id: userId, projects: joinedProjects };
            });
            setMembers(mappedMembers);
        } catch (error) { 
            console.error(error); 
        } finally { setIsLoading(false); }
    }, [projectId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Action Handlers ---

    // Change Role
    const handleChangeRole = async (userId, newRole) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/${userId}/role`, {
                method: 'PUT', headers: getHeaders(), body: JSON.stringify({ role: newRole })
            });
            if (!res.ok) throw new Error("Failed");
            setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
            showNotification("Role updated", "success");
        } catch (error) { showNotification("Failed to update role", "error"); }
    };

    // Logic Chọn Project để xóa
    const handleRemoveClick = (member) => {
        if (projectId) {
            setRemoveProjectConfirm({ 
                user: member, 
                targetProjectId: projectId, 
                projectName: 'this project' 
            });
            return;
        }

        if (!member.projects || member.projects.length === 0) {
            showNotification("User not in any project", "error");
            return;
        }

        if (member.projects.length === 1) {
            setRemoveProjectConfirm({ 
                user: member, 
                targetProjectId: member.projects[0]._id, 
                projectName: member.projects[0].name 
            });
        } else {
            setSelectProjectModal(member);
        }
    };

    // --- Xoa Member khoi project (Tìm Membership ID) ---
    const executeRemoveMember = async () => {
        if (!removeProjectConfirm) return;
        const { user, targetProjectId } = removeProjectConfirm;

        try {
            const targetProjectObj = user.projects.find(p => p._id === targetProjectId);
            let idToDelete = user.id;

            if (targetProjectObj && targetProjectObj.members) {
                const membership = targetProjectObj.members.find(m => {
                    const mUserId = m.user._id || m.user;
                    return String(mUserId) === String(user.id);
                });
                
                if (membership) idToDelete = membership._id; 
            }

            const res = await fetch(`${API_BASE_URL}/projects/${targetProjectId}/members/${idToDelete}`, {
                method: 'DELETE', headers: getHeaders()
            });
            if (!res.ok) throw new Error("Failed");
            
            showNotification("Member removed from project", "success");
            
            if (projectId) {
                setMembers(prev => prev.filter(m => m.id !== user.id));
            } else {
                setMembers(prev => prev.map(m => {
                    if (m.id === user.id) {
                        return {
                            ...m,
                            projects: m.projects.filter(p => p._id !== targetProjectId)
                        };
                    }
                    return m;
                }));
            }
            
            setRemoveProjectConfirm(null);
            fetchData();
        } catch (error) { 
            console.error(error);
            showNotification("Failed to remove member", "error"); 
        }
    };

    // Logic Xóa User Hệ Thống
    const handleDeleteUser = async () => {
        if (!deleteUserModal) return;
        try {
            const res = await fetch(`${API_BASE_URL}/users/${deleteUserModal.id}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) throw new Error("Failed");
            showNotification("User deleted", "success");
            setMembers(prev => prev.filter(m => m.id !== deleteUserModal.id));
            setDeleteUserModal(null);
        } catch (error) { showNotification("Failed to delete user", "error"); }
    };

    const handleInfo = (user) => { setSelectedUser(user); setIsInfoModalOpen(true); };
    const handleAssign = (user) => { setSelectedUser(user); setIsAssignModalOpen(true); };

    const filteredMembers = members.filter(member =>
        (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const isAdmin = currentUserRole === 'Admin';

    return (
        <div className="flex-1 p-6 md:p-8 bg-gray-50 min-h-screen relative">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />

            <ConfirmModal 
                isOpen={!!deleteUserModal}
                title="Delete User"
                message={`Permanently delete "${deleteUserModal?.name}"?`}
                onClose={() => setDeleteUserModal(null)}
                onConfirm={handleDeleteUser}
                isDanger={true}
            />

            <ConfirmModal 
                isOpen={!!removeProjectConfirm}
                title="Remove from Project"
                message={`Remove "${removeProjectConfirm?.user?.name}" from project "${removeProjectConfirm?.projectName}"?`}
                onClose={() => setRemoveProjectConfirm(null)}
                onConfirm={executeRemoveMember}
                confirmText="Remove"
                isDanger={false}
            />

            <SelectProjectModal 
                isOpen={!!selectProjectModal}
                user={selectProjectModal}
                onClose={() => setSelectProjectModal(null)}
                onSelectProject={(pId, pName) => {
                    setSelectProjectModal(null);
                    setRemoveProjectConfirm({ user: selectProjectModal, targetProjectId: pId, projectName: pName });
                }}
            />


            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-auto">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search members..." 
                            className="w-full md:w-96 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 shadow-sm"
                            style={{ '--tw-ring-color': 'var(--color-brand)' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* NÚT ADD MEMBER */}
                    {isAdmin && (
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-sm"
                            style={{ backgroundColor: 'var(--color-brand)' }}
                        >
                            <UserPlusIcon className="w-5 h-5" />
                            <span>Add Member</span>
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isAdmin && (
                        <div className="px-6 py-3 border-b flex items-center gap-2" style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 5%, white)', borderColor: 'color-mix(in srgb, var(--color-brand) 20%, white)' }}>
                            <ShieldCheckIcon className="w-5 h-5" style={{ color: 'var(--color-brand)' }} />
                            <span className="text-sm font-bold" style={{ color: 'var(--color-brand)' }}>Admin Management Mode</span>
                        </div>
                    )}
                    
                    {isLoading ? <LoaderOverlay /> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Projects Joined</th>
                                        {isAdmin && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 group transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Avatar name={member.name} avatarUrl={member.avatarUrl} />
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900">{member.name}</div>
                                                        <div className="text-sm text-gray-500">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <RoleSelect currentRole={member.role} userId={member.id} onChange={handleChangeRole} canEdit={isAdmin} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, white)', color: 'var(--color-brand)' }}>
                                                    {member.projects?.length || 0} Projects
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleInfo(member)} className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50">
                                                            <InformationCircleIcon className="w-5 h-5" />
                                                        </button>
                                                        
                                                        {(projectId || (member.projects && member.projects.length > 0)) && (
                                                            <button onClick={() => handleRemoveClick(member)} className="text-gray-400 hover:text-orange-600 p-1 rounded-full hover:bg-orange-50">
                                                                <FolderMinusIcon className="w-5 h-5" />
                                                            </button>
                                                        )}

                                                        <button onClick={() => handleAssign(member)} className="text-gray-400 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50">
                                                            <FolderPlusIcon className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => setDeleteUserModal(member)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <AddMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddMember={() => { setIsAddModalOpen(false); fetchData(); showNotification("Member added", "success"); }} />
            <AssignToProjectModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} onAssignSuccess={() => { fetchData(); showNotification("Assigned successfully", "success"); }} />
            <UserInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} user={selectedUser} />
        </div>
    );
}

export default Members;