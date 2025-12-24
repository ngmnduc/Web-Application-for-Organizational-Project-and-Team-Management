import express from "express";
import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead
} from "../controllers/notification.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   GET /notifications
 * @desc    Get user notifications (polling support)
 * @access  Private
 */
router.get("/notifications", verifyToken, getNotifications);

/**
 * @route   PATCH /notifications/read-all
 * @desc    Mark ALL notifications as read
 * @access  Private
 */
router.patch("/notifications/read-all", verifyToken, markAllAsRead);

/**
 * @route   PATCH /notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.patch("/notifications/:id/read", verifyToken, markAsRead);

export default router;