import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const PRIMARY_COLOR = '#f35640'; 
const API_BASE_URL = 'http://localhost:4000/api';

const AssignToProjectModal = ({ isOpen, onClose }) => {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hàm lấy Header chứa Token
    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
    });

    // Load dữ liệu thật khi mở Modal
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    // Gọi song song 2 API lấy User và Project
                    const [usersRes, projectsRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/users`, { headers: getHeaders() }),
                        fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() })
                    ]);

                    const usersData = await usersRes.json();
                    const projectsData = await projectsRes.json();

                    setUsers(usersData.data || []);
                    setProjects(projectsData.data || []);
                } catch (error) {
                    console.error("Lỗi tải dữ liệu:", error);
                    alert("Không thể tải danh sách User hoặc Project.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUser || !selectedProject) {
            alert("Vui lòng chọn cả thành viên và dự án.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Gọi API Assign 
            const response = await fetch(`${API_BASE_URL}/projects/${selectedProject}/members`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ userId: selectedUser, role: 'Member' })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Gán thất bại");
            }

            alert("Đã gán thành viên vào dự án thành công!");
            onClose();
            // Reset form
            setSelectedUser('');
            setSelectedProject('');
        } catch (error) {
            alert(`Lỗi: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Assign Member</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isLoading ? (
                        <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
                    ) : (
                        <>
                            {/* Chọn Member */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Member <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:border-red-500"
                                    value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
                                >
                                    <option value="">Select a member...</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Chọn Project */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Project <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:border-red-500"
                                    value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value="">Select a project...</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm bg-white border rounded-lg">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || isLoading}
                            className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                            {isSubmitting ? 'Assigning...' : 'Assign Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignToProjectModal;