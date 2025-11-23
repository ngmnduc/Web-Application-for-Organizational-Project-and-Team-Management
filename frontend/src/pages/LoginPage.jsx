import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../services/authService';
import tag from '../assets/images/logo.png';
import { useAuth } from '../services/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '../services/authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { saveLogin } = useAuth();

  useEffect(() => {
    // Khi component LoginPage hiện lên, xóa ngay lập tức token cũ
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Nếu AuthContext của bạn có state user, việc xóa localStorage
    // sẽ giúp khi F5 hoặc navigate, AppRouter sẽ tự hiểu là user = null
  }, []);
  //GG trả về
  const handleGoogleSuccess = async (credentialResponse) => {
  try {
    const { credential } = credentialResponse;
    // Gọi hàm service (đã thống nhất) để gửi token lên BE
    const data = await loginWithGoogle(credential); 
    
    // TODO FE1 làm AuthContext
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
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiLogin(email, password);
      saveLogin(res.user, res.token);
      // Đăng nhập thành công, chuyển hướng về trang chủ
      if(res.user.role === "admin"){
        navigate('admin/home');
      }else{
        navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.error?.message || 'Login failed. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-background2 bg-center bg-cover min-h-screen flex items-center justify-end pr-32 relative text-white">
      {/* QUOTE SECTION */}
      <div className="absolute left-20 max-w-xl">
        <h1 className="text-6xl font-bold leading-tight drop-shadow-lg">
          "The best way to predict the future is to create it."
        </h1>
        <p className="mt-6 text-lg text-gray-200 italic drop-shadow-md">
          — Tom Ca Chua - 2025
        </p>
      </div>

      {/* LOGIN FORM */}
      <div className="backdrop-blur-[30px] bg-white/20 border border-white/30 flex rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.37)] w-[500px] p-5 items-center justify-center" 
           style={{
             WebkitBackdropFilter: "blur(30px) saturate(150%)",
             backdropFilter: "blur(30px) saturate(150%)",
           }}>
        
        <div className="w-full px-8 md:px-10">
          <h2 className="font-bold font-sans text-2xl text-gray-600 justify-center flex items-center">
            Welcome Back
          </h2>
          <p className="text-gray-500 mt-4 mb-4 flex items-center justify-center">
            Sign in to continue your work
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-gray-200 text-sm mb-1">Email address</label>
              <input
                className="p-3 rounded-xl border w-full text-gray-800"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Email"
                disabled={isLoading}
              />
            </div>
            
            <div className="relative">
              <label className="block text-gray-200 text-sm mb-1">Password</label>
              <input
                className="p-3 rounded-xl border w-full text-gray-800"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Password"
                disabled={isLoading}
              />
            </div>
            
            <div className="text-right">
              <button type="button" className="text-sm text-brand hover:underline">
                Forgot Password?
              </button>
            </div>
            
            <button
              type="submit"
              className="bg-brand rounded-xl font-medium text-white py-3 hover:scale-105 duration-300 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : 'Login'}
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
            Don't have an account?{" "}
            <a href="/signup" className="text-brand font-medium hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
      
      <img src={tag} alt="logo" className="absolute top-1 right-1 w-40 h-auto" />
    </section>
  );
};

export default LoginPage;