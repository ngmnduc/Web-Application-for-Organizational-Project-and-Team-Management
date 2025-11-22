import mongoose from "mongoose";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import ActivityLog from "../models/activityLog.model.js";

/**
 * @desc    Get all tasks in a project (not deleted)
 * @route   GET /projects/:id/tasks
 * @access  Private (Admin/Manager/Member)
 */
export const getTasksByProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const tasks = await Task.find({ projectId, deletedAt: null })
      .populate({
        path: "assigneeId",
        select: "name email role",
      })
      .populate({
        path: "projectId",
        select: "name",
      });

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
 * @desc    Filter tasks by project, assignee, or status
 * @route   GET /tasks?project=...&assignee=...&status=...
 * @access  Private (Admin/Manager/Member)
 */
export const getFilteredTasks = async (req, res) => {
  try {
    const { project, assignee, status } = req.query;
    const filter = { deletedAt: null };
    if (project) filter.projectId = project;
    if (assignee) filter.assigneeId = assignee;
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate("assigneeId", "name email role")
      .populate("projectId", "name");

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new task inside a project
 * @route   POST /projects/:id/tasks
 * @access  Private (Admin/Manager)
 */
export const createTask = async (req, res) => {
  try {
    const projectId = req.params.id;
    const {
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

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title and dueDate are required.",
      });
    }

    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

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

    // Activity Log: Create Task
    try {
      await ActivityLog.create({
        projectId: task.projectId,
        userId: req.user._id,
        taskId: task._id,
        action: "CREATE_TASK",
        content: `created task "${task.title}"`
      });
    } catch (logError) {
      console.error("Logging failed:", logError.message);
    }

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
 * @desc    Update task details (Admin/Manager/Member)
 * @route   PUT /tasks/:id
 * @access  Private
 */
export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userRole = req.user?.role;
    const userId = req.user?._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Members can only update their own tasks
    if (userRole === "Member") {
      if (String(task.assigneeId) !== String(userId)) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own tasks.",
        });
      }

      // Members can only change status
      const allowedKeys = ["status"];
      const invalid = Object.keys(req.body).some(
        (key) => !allowedKeys.includes(key)
      );
      if (invalid) {
        return res.status(403).json({
          success: false,
          message: "Members can only update task status.",
        });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, req.body, {
      new: true,
    });

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
 * @desc    Update only the status of a task (PATCH)
 * @route   PATCH /tasks/:id
 * @access  Private
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?._id;

    const task = await Task.findById(taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    // Members can only update the status of their own tasks
    if (userRole === "Member" && String(task.assigneeId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Members can only update their own task status.",
      });
    }

    task.status = status || task.status;
    await task.save();

    // Activity Log: Update Status
    try {
      await ActivityLog.create({
        projectId: task.projectId,
        userId: req.user._id,
        taskId: task._id,
        action: "UPDATE_STATUS",
        content: `updated status of task "${task.title}" to ${status}`
      });
    } catch (logError) {
      console.error("Logging failed:", logError.message);
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Soft delete a task (Admin/Manager only)
 * @route   DELETE /tasks/:id
 * @access  Private
 */
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userRole = req.user?.role;

    if (!["Admin", "Manager"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete tasks.",
      });
    }

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

/**
 * @desc    Create a subtask (checklist item)
 * @route   POST /tasks/:taskId/subtasks
 * @access  Private
 */
export const createSubtask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;
    const userId = req.user._id;

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: "Title is required" 
      });
    }

    const parentTask = await Task.findById(taskId);
    if (!parentTask) {
      return res.status(404).json({ 
        success: false, 
        message: "Parent task not found" 
      });
    }

    // Create subtask inheriting projectId from parent
    const subtask = new Task({
      title,
      projectId: parentTask.projectId,
      parentId: taskId,
      assigneeId: userId,
      status: "TODO",
      priority: parentTask.priority
    });

    await subtask.save();

    res.status(201).json({
      success: true,
      message: "Subtask created successfully",
      data: subtask,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};