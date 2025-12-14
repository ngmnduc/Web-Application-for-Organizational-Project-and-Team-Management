import express from "express";
import {
  checkIn,
  getMyAttendanceToday,
  getProjectAttendance,
  getMyAttendance,
} from "../controllers/attendance.controller.js";
import { verifyToken, checkRole, requireOrgAccess } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   POST /projects/:projectId/attendance/checkin
 * @desc    Check-in attendance for a project
 * @access  Private
 */
router.post("/projects/:projectId/attendance/checkin", verifyToken, requireOrgAccess, checkIn);

/**
 * @route   GET /projects/:projectId/attendance/me
 * @desc    Get my attendance today for a project
 * @access  Private
 */
router.get("/projects/:projectId/attendance/me", verifyToken, requireOrgAccess, getMyAttendanceToday);

/**
 * @route   GET /projects/:projectId/attendance
 * @desc    Get all attendance for a project (Admin/Manager only)
 * @access  Private (Admin/Manager)
 */
router.get(
  "/projects/:projectId/attendance",
  verifyToken,
  requireOrgAccess,
  checkRole("Admin", "Manager"),
  getProjectAttendance
);

/**
 * @route   GET /attendance/me
 * @desc    Get my attendance history across all projects
 * @access  Private
 */
router.get("/attendance/me", verifyToken, requireOrgAccess, getMyAttendance);

export default router;