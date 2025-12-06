import express from "express";
import {
  checkIn,
  getMyAttendanceToday,
  getAllAttendance, 
  getMyAttendance,
} from "../controllers/attendance.controller.js";
import { verifyToken, checkRole } from "../middlewares/auth.js";

const router = express.Router();

router.use(verifyToken);

/**
 * @route   POST /api/attendance/checkin
 * @desc    Check-in hằng ngày 
 * @access  Private (All Users)
 */
router.post("/checkin", checkIn);

/**
 * @route   GET /api/attendance/today
 * @desc    Xem trạng thái chấm công hôm nay của mình 
 * @access  Private (All Users)
 */
router.get("/today", getMyAttendanceToday);

/**
 * @route   GET /api/attendance/me
 * @desc    Xem lịch sử chấm công của bản thân 
 * @access  Private (All Users)
 */
router.get("/me", getMyAttendance);

/**
 * @route   GET /api/attendance
 * @desc    Xem danh sách chấm công (Admin xem all, Manager xem nhân viên mình quản lý)
 * @access  Private (Admin & Manager)
 */
router.get(
  "/",
  checkRole("Admin", "Manager"), 
  getAllAttendance
);

export default router;