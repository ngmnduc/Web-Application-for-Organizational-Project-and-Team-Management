import React from 'react'
import { FaGoogle,FaApple} from 'react-icons/fa';
const LoginPage = () => {
  return (
    <>
    <div className="flex flex-row h-screen font-sans">
      {/* Left Section */}
      <div className="flex flex-col justify-center items-center md:w-1/2 w-full bg-white px-10 py-8">
        
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 px-4 py-3 rounded-lg mb-3">
            <span className="text-white font-bold text-sm">CHÈN LOGO VÀO ĐÂY</span>
          </div>
          <h1 className="text-2xl font-bold">USTH ERP</h1>
        </div>

        
        <h2 className="text-xl font-semibold mb-2 text-center">Welcome Back!</h2>
        <p className="text-gray-500 text-center mb-6">
          Sign in to access your dashboard and continue your work
        </p>

        
        <form className="space-y-4 w-full max-w-sm">
          <div>
            <label className="block text-gray-600 text-sm mb-1">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="text-right mt-1">
            <a href="/" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </form>

        
        <div className="my-4 flex items-center justify-center">
          <span className="text-gray-400 text-sm">OR</span>
        </div>

        
        <div className="space-y-2 w-full max-w-sm">
          <button className="w-full border py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-100 transition">
            <FaGoogle /> Continue with Google
          </button>
          <button className="w-full border py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-100 transition">
            <FaApple /> Continue with Apple
          </button>
        </div>

        
        <p className="text-center text-gray-500 mt-6 text-sm">
          Don’t have an account?{" "}
          <a href="/" className="text-blue-600 font-medium hover:underline">
            Sign Up
          </a>
        </p>
      </div>

      {/* Right Section */}
      <div className="md:w-1/2 w-full bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col justify-center items-center text-white px-10 text-center py-12">
        <h1 className="text-xl font-bold mb-4">
          Revolutionize Your Workflow with Smarter Automation
        </h1>
        <p className="italic mb-6">
          “Whether you think you can or you think you can't — you're right.”
        </p>
        <div className="flex justify-center gap-10 text-sm">
          <div> Secure</div>
          <div>Fast</div>
          <div> Collaborative</div>
        </div>
      </div>
    </div>
    </>
  )
}

export default LoginPage