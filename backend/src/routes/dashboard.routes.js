import express from "express";
import { verifyToken, checkRole } from "../middlewares/auth.js"; 
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = express.Router();

/**
 * @route   GET /api/dashboard/admin-stats
 * @desc    Get comprehensive Organization statistics (Admin only)
 * @access  Private (Admin)
 */
router.get("/dashboard/admin-stats", verifyToken, checkRole("Admin"), dashboardController.getAdminStats
);

/**
 * @route   GET /api/dashboard/manager-stats
 * @desc    Get statistics for managed projects (Admin or Project Manager)
 * @access  Private
 */
router.get("/dashboard/manager-stats", verifyToken, dashboardController.getManagerStats);

/**
 * @route   GET /api/dashboard/member-stats
 * @desc    Get personal statistics and 7-day activity chart
 * @access  Private (Logged in users)
 */
router.get("/dashboard/member-stats", verifyToken, dashboardController.getMemberStats);

export default router;