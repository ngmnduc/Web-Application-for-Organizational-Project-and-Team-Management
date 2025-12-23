import { Router } from "express";
import { signup, login, handleGoogleLogin, forgotPassword, resetPassword, } from "../controllers/auth.controller.js";

const router = Router();

// Định nghĩa các đường dẫn
router.post("/signup", signup);
router.post("/login", login);
router.post("/google", handleGoogleLogin); 
// Private
router.get("/me", verifyToken, me);                  // Lấy info
router.get("/profile", verifyToken, me);             // Alias cho me 
router.patch("/profile", verifyToken, updateProfile);// Cập nhật info (Avatar, Tên...)
router.post("/change-password", verifyToken, changePassword);
router.post("/switch-org", verifyToken, switchOrg);
router.post("/forgot-password", forgotPassword); // API gửi email reset
router.post("/reset-password", resetPassword);   // API đặt lại mật khẩu mới

export default router;