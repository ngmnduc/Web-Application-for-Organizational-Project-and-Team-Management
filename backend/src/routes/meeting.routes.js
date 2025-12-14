import express from "express";
import {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "../controllers/meeting.controller.js";
import { verifyToken, checkRole, requireOrgAccess } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   GET /projects/:projectId/meetings
 * @desc    Get all meetings for a project
 * @access  Private - Requires organization context
 */
router.get("/projects/:projectId/meetings", verifyToken, requireOrgAccess, getMeetings);

/**
 * @route   GET /meetings/:id
 * @desc    Get single meeting details
 * @access  Private - Requires organization context
 */
router.get("/meetings/:id", verifyToken, requireOrgAccess, getMeeting);

/**
 * @route   POST /projects/:projectId/meetings
 * @desc    Create new meeting (with time conflict validation)
 * @access  Private (Admin/Manager) - Requires organization context
 */
router.post(
  "/projects/:projectId/meetings",
  verifyToken,
  requireOrgAccess,
  checkRole("Admin", "Manager"),
  createMeeting
);

/**
 * @route   PATCH /meetings/:id
 * @desc    Update meeting
 * @access  Private (Admin/Manager/Creator) - Requires organization context
 */
router.patch("/meetings/:id", verifyToken, requireOrgAccess, updateMeeting);

/**
 * @route   DELETE /meetings/:id
 * @desc    Delete meeting (soft delete)
 * @access  Private (Admin/Manager/Creator) - Requires organization context
 */
router.delete("/meetings/:id", verifyToken, requireOrgAccess, deleteMeeting);

export default router;
