import React, { useState, useEffect, useCallback } from 'react';
import { 
    UserPlusIcon, 
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    InformationCircleIcon, 
    FolderMinusIcon,       
    FolderPlusIcon,        
    TrashIcon,             
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useParams } from 'react-router-dom'; 

// Components
import { LoaderOverlay } from '../components/LoaderOverlay';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import AddMemberModal from '../components/AddMemberModal';
import AssignToProjectModal from '../components/AssignToProjectModal';

const PRIMARY_COLOR = '#f35640';
const API_BASE_URL = 'http://localhost:4000/api'; 

// --- Sub-component: Avatar ---
const Avatar = ({ name, avatarUrl }) => {
    if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />;
    
    const safeName = name || "Unknown";
    const initials = safeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    return (
        <div 
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ 
                backgroundColor: `${PRIMARY_COLOR}20`, 
                color: PRIMARY_COLOR 
            }}
        >
            {initials}
        </div>
    );
};

// --- Sub-component: Project Badge ---
const ProjectBadge = ({ name }) => {
    // Tạo màu ngẫu nhiên cố định theo tên dự án
    const colors = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500', 'text-pink-500'];
    const colorIndex = name.length % colors.length;
    const dotColor = colors[colorIndex];

    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 mr-2 mb-1">
            <span className={`w-2 h-2 mr-1.5 rounded-full ${dotColor} bg-current`}></span>
            {name}
        </span>
    );
};

// --- 2. Sub-component: Role Select ---
const RoleSelect = ({ currentRole, userId, onChange, canEdit }) => {
    // Style riêng cho từng Role
    const getRoleStyle = (role) => {
        switch (role) {
            case 'Admin':
                return {
                    backgroundColor: `${PRIMARY_COLOR}20`, 
                    color: PRIMARY_COLOR,                 
                    borderColor: `${PRIMARY_COLOR}40`
                };
            case 'Manager':
                return {
                    backgroundColor: '#dbeafe', 
                    color: '#1d4ed8',           
                    borderColor: '#bfdbfe'      
                };
            default: // Member
                return {
                    backgroundColor: '#f3f4f6', 
                    color: '#374151',           
                    borderColor: '#e5e7eb'      
                };
        }
    };

    const style = getRoleStyle(currentRole);

    // Nếu không phải Admin -> Chỉ hiện Badge tĩnh
    if (!canEdit) {
        return (
            <span 
                className="px-3 py-1 text-xs font-semibold rounded-full border"
                style={style}
            >
                {currentRole}
            </span>
        );
    }

    // Nếu là Admin -> Hiện Dropdown có mũi tên
    return (
        <div className="relative inline-block">
            <select
                value={currentRole}
                onChange={(e) => onChange(userId, e.target.value)}
                className="appearance-none cursor-pointer pl-3 pr-8 py-1 text-xs font-bold rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all"
                style={{
                    ...style,
                    '--tw-ring-color': PRIMARY_COLOR 
                }}
            >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Member">Member</option>
            </select>
            
            {/* Mũi tên tùy chỉnh (Custom Arrow) */}
            <div 
                className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2"
                style={{ color: style.color }} // Mũi tên cùng màu với chữ
            >
                <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
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
    
    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    
    // Auth State
    const [currentUserRole, setCurrentUserRole] = useState('Member');

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUserRole(JSON.parse(userStr).role || 'Member');
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Xác định URL lấy User
            const userUrl = projectId 
                ? `${API_BASE_URL}/projects/${projectId}/members` 
                : `${API_BASE_URL}/users`;

            // 2. Gọi song song: Lấy User VÀ Lấy tất cả Project (để map xem user tham gia dự án nào)
            const [usersRes, projectsRes] = await Promise.all([
                fetch(userUrl, { headers: getHeaders() }),
                fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() })
            ]);

            if (!usersRes.ok) throw new Error('Failed to fetch users');
            
            const usersResult = await usersRes.json();
            const projectsResult = await projectsRes.json();

            const userList = usersResult.data || [];
            const projectList = projectsResult.data || [];

            // 3. Ghép dữ liệu: Tìm xem mỗi user tham gia những project nào
            const mappedMembers = userList.map(user => {
                const userId = user._id || user.id; 
                
                // Lọc ra các dự án mà user này có trong danh sách members
                const joinedProjects = projectList.filter(proj => 
                    proj.members.some(m => (m.user === userId || m.user?._id === userId))
                );

                return {
                    id: userId,
                    name: user.name || user.fullName || "Unknown",
                    email: user.email || "",
                    role: user.role || 'Member',
                    avatarUrl: user.avatar || null,
                    projects: joinedProjects // Mảng các dự án user tham gia
                };
            });

            setMembers(mappedMembers);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- ACTIONS ---
    const handleChangeRole = async (userId, newRole) => {
        setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
        try {
            const res = await fetch(`${API_BASE_URL}/auth/${userId}/role`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ role: newRole })
            });
            if (!res.ok) throw new Error("Failed");
        } catch (error) {
            alert("Lỗi cập nhật quyền!");
            fetchData();
        }
    };

    // Các hàm xử lý click khác
    const handleInfo = (user) => { alert(`Info: ${user.name}\nEmail: ${user.email}`); };
    const handleRemoveFromProject = (user) => { if(window.confirm(`Xóa ${user.name} khỏi dự án?`)) alert("Cần API remove member"); };
    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Xóa vĩnh viễn user "${user.name}"?`)) return;
        setMembers(prev => prev.filter(m => m.id !== user.id));
        try {
             await fetch(`${API_BASE_URL}/users/${user.id}`, { method: 'DELETE', headers: getHeaders() });
        } catch (error) { console.error(error); }
    };

    // Filter
    const filteredMembers = members.filter(member =>
        (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const isAdmin = currentUserRole === 'Admin';

    const renderContent = () => {
        if (isLoading) return <LoaderOverlay />;
        if (filteredMembers.length === 0) return <EmptyState title="No Members" message="No users found." />;
        
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                            {/* Cột mới: Projects Joined */}
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Projects Joined</th>
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
                                    <RoleSelect 
                                        currentRole={member.role} 
                                        userId={member.id} 
                                        onChange={handleChangeRole} 
                                        canEdit={isAdmin}
                                    />
                                </td>
                                
                                {/* Hiển thị danh sách dự án tham gia */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap items-center">
                                        {member.projects && member.projects.length > 0 ? (
                                            member.projects.map(proj => (
                                                <ProjectBadge key={proj._id} name={proj.name} />
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No projects assigned</span>
                                        )}
                                    </div>
                                </td>
                                
                                {isAdmin && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleInfo(member)} className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50" title="Info">
                                                <InformationCircleIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleRemoveFromProject(member)} className="text-gray-400 hover:text-orange-600 p-1 rounded-full hover:bg-orange-50" title="Remove from Project">
                                                <FolderMinusIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => { /* Reuse Modal Assign but prefill user */ setIsAssignModalOpen(true); }} className="text-gray-400 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50" title="Assign to Project">
                                                <FolderPlusIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDeleteUser(member)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50" title="Delete User">
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
        );
    };

    return (
        <div className="flex-1 p-6 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-auto">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search members..." 
                            className="w-full md:w-96 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 shadow-sm"
                            style={{ '--tw-ring-color': PRIMARY_COLOR }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <button onClick={() => setIsAddModalOpen(true)} 
                            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-all transform active:scale-95" 
                            style={{ backgroundColor: PRIMARY_COLOR }}>
                            <UserPlusIcon className="w-5 h-5" /> Add Member
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Admin Badge Header */}
                    {isAdmin && (
                        <div 
                            className="px-6 py-3 border-b flex justify-between items-center"
                            style={{ backgroundColor: `${PRIMARY_COLOR}08`, borderColor: `${PRIMARY_COLOR}20` }}
                        >
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
                                <span className="text-sm font-bold" style={{ color: PRIMARY_COLOR }}>
                                    Admin Management Mode
                                </span>
                            </div>
                        </div>
                    )}
                    {renderContent()}
                </div>
            </div>

            {/* Modals */}
            <AddMemberModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onAddMember={() => { setIsAddModalOpen(false); fetchData(); }} 
            />
            <AssignToProjectModal 
                isOpen={isAssignModalOpen} 
                onClose={() => setIsAssignModalOpen(false)}
            />
        </div>
    );
}

export default Members;