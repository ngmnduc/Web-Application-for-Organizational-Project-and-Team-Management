import express from "express";
import { createComment, getCommentsByTask } from "../controllers/comment.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route  POST /comments
 * @desc   Create a new comment, parse mentions, and generate notifications
 */
router.post("/comments", verifyToken, createComment);

/**
 * @route  GET /comments/:taskId
 * @desc   Get all comments for a specific task
 */
router.get("/comments/:taskId", verifyToken, getCommentsByTask);

export default router;
