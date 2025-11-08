import express from "express";
import {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @route   GET /projects/:id/tasks
 * @desc    Lấy danh sách task trong 1 project (chưa bị xóa)
 * @access  Private (Admin/Manager/Member)
 */
router.get("/projects/:id/tasks", verifyToken, getTasksByProject);

/**
 * @route   POST /projects/:id/tasks
 * @desc    Tạo task mới trong project (Chỉ admin/manager mới được tạo)
 * @access  Private (Admin/Manager)
 */
router.post("/projects/:id/tasks", verifyToken, checkRole(["Admin", "Manager"]), createTask);

/**
 * @route   PUT /tasks/:id
 * @desc    Cập nhật thông tin task
 * @access  Private (Admin/Manager/Member)
 */
router.put("/tasks/:id", verifyToken, updateTask);

/**
 * @route   DELETE /tasks/:id
 * @desc    Xóa mềm 1 task (đánh dấu deletedAt)
 * @access  Private (Admin/Manager)
 */
router.delete("/tasks/:id", verifyToken, checkRole(["Admin", "Manager"]), deleteTask);

export default router;
