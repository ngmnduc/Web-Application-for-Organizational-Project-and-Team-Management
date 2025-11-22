import React, { useState } from 'react'; 
import { XMarkIcon } from '@heroicons/react/24/outline';

const PRIMARY_COLOR = '#f35640'; 
const API_BASE_URL = 'http://localhost:4000/api';

const AddMemberModal = ({ isOpen, onClose, onAddMember }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); 
    const [role, setRole] = useState('Member');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) {
            alert('Please fill in Name, Email and Password.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            // Gọi API đăng ký thật
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }) 
                //  Route signup hiện tại chưa nhận 'role' từ body, nó tự set mặc định, đợi khi xong sẽ sửa
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || "Failed to create user");
            }

            // Gọi callback để cha refresh lại danh sách
            if (onAddMember) onAddMember(); 
            
            alert("User created successfully!");
            
            // Reset & Close
            setName('');
            setEmail('');
            setPassword('');
            setRole('Member');
            onClose();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Add New Member</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                        <input type="text" className="w-full px-3 py-2 border rounded-lg" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input type="email" className="w-full px-3 py-2 border rounded-lg" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    {/* Thêm trường Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                        <input type="password" className="w-full px-3 py-2 border rounded-lg" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required />
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm bg-white border rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}>
                            {isSubmitting ? 'Creating...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;