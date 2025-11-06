import mongoose from "mongoose";
import Task from "../models/task.model.js";

/**
 * @desc    Lấy tất cả task trong 1 project (chưa bị xóa)
 * @route   GET /projects/:id/tasks
 * @access  Private (Admin/Manager/Member)
 */
export const getTasksByProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const tasks = await Task.find({ projectId, deletedAt: null });
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Tạo task mới trong project
 * @route   POST /projects/:id/tasks
 * @access  Private (Admin/Manager)
 */
export const createTask = async (req, res) => {
  try {
    const projectId = req.params.id;
    let {
      title,
      description,
      priority,
      status,
      assigneeId,
      startDate,
      dueDate,
      estimateHours,
      spentHours,
      orderIndex,
      parentId,
    } = req.body;

    // Validate bắt buộc
    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title and dueDate are required.",
      });
    }

    // Ép kiểu ObjectId cho các field liên kết
    const convertedProjectId = new mongoose.Types.ObjectId(projectId);
    const convertedAssigneeId = assigneeId
      ? new mongoose.Types.ObjectId(assigneeId)
      : null;
    const convertedParentId = parentId
      ? new mongoose.Types.ObjectId(parentId)
      : null;

    const task = new Task({
      title,
      description,
      priority,
      status,
      assigneeId: convertedAssigneeId,
      startDate,
      dueDate,
      estimateHours,
      spentHours,
      orderIndex,
      parentId: convertedParentId,
      projectId: convertedProjectId,
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cập nhật thông tin task
 * @route   PUT /tasks/:id
 * @access  Private (Admin/Manager/Member)
 */
export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    // ép kiểu nếu có assigneeId mới
    if (req.body.assigneeId) {
      req.body.assigneeId = new mongoose.Types.ObjectId(req.body.assigneeId);
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, req.body, {
      new: true,
    });

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Soft delete task (đánh dấu xóa)
 * @route   DELETE /tasks/:id
 * @access  Private (Admin/Manager)
 */
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const deletedTask = await Task.findByIdAndUpdate(
      taskId,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task soft-deleted successfully",
      data: deletedTask,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
