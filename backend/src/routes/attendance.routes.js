import express from "express";
import {
  checkIn,
  getMyAttendanceToday,
  getProjectAttendance,
  getMyAttendance,
  getMyCurrentIP,
  addWhitelistIP,
  getWhitelistIPs
} from "../controllers/attendance.controller.js";
import { verifyToken, checkRole, requireOrgAccess } from "../middlewares/auth.js";

const router = express.Router();

//  General attendance routes (không cần projectId)
/**
 * @route   POST /attendance/checkin
 * @desc    Check-in attendance (auto-detect organization from user)
 * @access  Private
 */
router.post("/checkin", verifyToken,requireOrgAccess, checkIn);

/**
 * @route   GET /attendance/me/today
 * @desc    Get my attendance today
 * @access  Private
 */
router.get("/me/today", verifyToken, getMyAttendanceToday);

/**
 * @route   GET /attendance/me
 * @desc    Get my attendance history
 * @access  Private
 */
router.get("/me", verifyToken,requireOrgAccess, getMyAttendance);

/**
 * @route   GET /attendance/all
 * @desc    Get all attendance for organization (Admin/Manager only)
 * @access  Private (Admin/Manager)
 */
router.get(
  "/all",
  verifyToken,
  requireOrgAccess,
  checkRole("Admin", "Manager"),
  getProjectAttendance
);

// IP Management routes
/**
 * @route   GET /attendance/my-ip
 * @desc    Get current IP address (for Admin/Manager)
 * @access  Private (Admin/Manager)
 */
router.get(
  '/my-ip',
  verifyToken,
  checkRole("Admin", "Manager"),
  getMyCurrentIP
);

/**
 * @route   POST /attendance/whitelist-ip
 * @desc    Add IP to organization whitelist
 * @access  Private (Admin/Manager)
 */
router.post(
  '/whitelist-ip',
  verifyToken,
  checkRole("Admin", "Manager"),
  addWhitelistIP
);

/**
 * @route   GET /attendance/whitelist
 * @desc    Get organization IP whitelist
 * @access  Private (Admin/Manager)
 */
router.get(
  '/whitelist',
  verifyToken,
  checkRole("Admin", "Manager"),
  getWhitelistIPs
);

export default router;