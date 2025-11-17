import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/authService';
import tag from '../assets/images/logo.png';
import { Mail, Lock, User } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '../services/authService';
const SignUpPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleSuccess = async (credentialResponse) => {
  try {
    const { credential } = credentialResponse;
    // Gọi hàm service (đã thống nhất) để gửi token lên BE
    const data = await loginWithGoogle(credential); 
    
    // TODO: Đợi FE1 làm AuthContext
    // auth.login(data.user, data.token); // Cập nhật state toàn app
    
    navigate('/home'); // Chuyển trang
  } catch (err) {
    console.error("Google login failed", err);
    setError("Google login failed. Please try again.");
  }
};

const handleGoogleError = () => {
  console.error('Google Login Failed');
  setError("Google login failed.");
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await signup(name, formData.email, formData.password);
      // Đăng ký thành công, chuyển hướng về trang đăng nhập
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.error?.message || 'Signup failed. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-background bg-center bg-cover min-h-screen flex items-center justify-center relative">
      <div className="backdrop-blur-[30px] bg-white/20 border border-white/30 flex rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.37)] w-[500px] p-5 items-center justify-center" 
           style={{
             WebkitBackdropFilter: "blur(30px) saturate(150%)",
             backdropFilter: "blur(30px) saturate(150%)",
           }}>
        
        <div className="w-full px-8 md:px-10">
          <h2 className="font-bold font-sans text-2xl text-gray-100 justify-center flex items-center space-x-2">
            <span>Welcome to </span><span className="text-brand">Syncora</span>
          </h2>
          <p className="text-gray-200 mt-4 mb-4 flex items-center justify-center text-center">
            Join thousands of teams already using Syncora to streamline their workflow
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full font-medium bg-brand rounded-xl text-white py-2 hover:scale-105 duration-300 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : 'Create My Account'}
            </button>
          </form>

          <div className="mt-6 grid grid-cols-3 items-center text-gray-400">
            <hr className="border-gray-400" />
            <p className="text-center text-sm">OR</p>
            <hr className="border-gray-400" />
          </div>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline" // Tùy chỉnh giao diện
            size="large"
            width="100%"
          />

          <p className="text-center text-white mt-6 text-sm">
            Already have an account?{" "}
            <a href="/login" className="text-brand font-medium hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
      
      <img src={tag} alt="logo" className="absolute top-1 right-1 w-40 h-auto" />
    </section>
  );
};

export default SignUpPage;