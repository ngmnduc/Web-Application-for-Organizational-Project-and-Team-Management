import express from "express";
import { createComment, getCommentsByTask } from "../controllers/comment.controller.js";
import { verifyToken, requireOrgAccess } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   GET /tasks/:taskId/comments
 * @access  Private
 */
router.get("/tasks/:taskId/comments", verifyToken, requireOrgAccess, getCommentsByTask);

/**
 * @route   POST /tasks/:taskId/comments
 * @access  Private
 */
router.post("/tasks/:taskId/comments", verifyToken, requireOrgAccess, createComment);

export default router;