
import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import ActivityLog from "../models/activityLog.model.js";
import * as projectValidator from "../validators/project.validator.js";
import * as projectService from "../services/project.service.js";

// POST /projects
export const createProject = async (req, res) => {
  try {
    // 1. Validate input
    const validation = projectValidator.validateCreateProject(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    const creatorId = req.user && req.user._id;
    if (!creatorId) {
      return res.status(401).json({ 
        success: false, 
        error: "AuthenticationError", 
        message: "Unauthorized" 
      });
    }

    // Get current organization from user 
    const currentOrganizationId = req.user.currentOrganizationId;
    if (!currentOrganizationId) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "No active organization. Please switch to an organization first." 
      });
    }

    // 2. Call service with organizationId
    const project = await projectService.createProject(req.body, creatorId, currentOrganizationId);

    // 3. Return response
    res.status(201).json({ 
      success: true, 
      message: "Project created successfully", 
      data: project 
    });
  } catch (err) {
    // 4. Handle service errors
    if (err.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects
export const listProjects = async (req, res) => {
  try {
    // 1. Validate query
    const validation = projectValidator.validateProjectQuery(req.query);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    // 2. Call service
    const result = await projectService.listProjects(req.query);

    // 3. Return response
    res.json({ 
      success: true, 
      count: result.projects.length,
      pagination: result.pagination,
      data: result.projects 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects/:id
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Call service
    const project = await projectService.getProjectById(id);

    res.json({ success: true, data: project });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PUT /projects/:id
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate input
    const validation = projectValidator.validateUpdateProject(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    // 2. Call service
    const project = await projectService.updateProject(id, req.body, req.user._id);

    // 3. Return response
    res.json({ 
      success: true, 
      message: "Project updated successfully", 
      data: project 
    });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// DELETE /projects/:id
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Call service
    const project = await projectService.deleteProject(id, req.user._id);

    res.json({ success: true, message: "Project deleted", data: project });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects/:id/members
export const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;

    // Call service
    const members = await projectService.getProjectMembers(id);

    res.status(200).json({ 
      success: true, 
      data: members 
    });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PATCH /projects/:id/archive
export const toggleArchive = async (req, res) => {
  try {
    const { id } = req.params;

    // Call service
    const project = await projectService.toggleArchive(id, req.user._id);

    res.json({ 
      success: true, 
      message: `Project ${project.isArchived ? "archived" : "unarchived"}`, 
      data: project 
    });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Get project dashboard stats (Tasks count, Days left)
 * @route   GET /projects/:id/summary
 */
export const getProjectSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Get base summary from service
    const result = await projectService.getProjectSummary(id);
    const project = result.project;

    const now = new Date();

    // Get detailed task statistics
    const [totalTasks, todo, doing, done, overdue, high, medium, low] = await Promise.all([
      Task.countDocuments({ projectId: id, deletedAt: null }),
      Task.countDocuments({ projectId: id, status: "TODO", deletedAt: null }),
      Task.countDocuments({ projectId: id, status: "DOING", deletedAt: null }),
      Task.countDocuments({ projectId: id, status: "DONE", deletedAt: null }),
      Task.countDocuments({ projectId: id, priority: "HIGH", deletedAt: null }),
      Task.countDocuments({ projectId: id, priority: "MEDIUM", deletedAt: null }),
      Task.countDocuments({ projectId: id, priority: "LOW", deletedAt: null }),
      Task.countDocuments({
        projectId: id,
        deletedAt: null,
        dueDate: { $lt: now },
        status: { $ne: "DONE" }
      })
    ]);

    let daysLeft = 0;
    if (project.endDate) {
      const endDateField = project.endDate || project.deadline;
      if (endDateField) {
        const end = new Date(endDateField);
        const diffTime = end - now;
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) daysLeft = 0;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        todo,
        doing,
        done,
        overdue,
        daysLeft,
        priority: {
          high,
          medium,
          low
        },
        tasksByStatus: [
          { _id: 'TODO', count: todo },
          { _id: 'DOING', count: doing },
          { _id: 'DONE', count: done }
        ]
      }
    });
  } catch (error) {
    // Handle service errors
    if (error.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    if (error.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
};
/**
 * @desc    Get recent activity logs for project
 * @route   GET /projects/:id/activities
 */
export const getProjectActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Call service
    const activities = await projectService.getProjectActivities(id, limit);

    // Pagination for backward compatibility
    const page = parseInt(req.query.page) || 1;
    const total = activities.length;

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: activities
    });
  } catch (error) {
    // Handle service errors
    if (error.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
};

// GET /projects/pending-requests
export const getPendingRequests = async (req, res) => {
  try {
    // Call service
    const pendingList = await projectService.getPendingRequests();

    res.json({ success: true, data: pendingList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get current invite code, generate if null
 * @route   GET /projects/:id/invite-code
 * @access  Private (Admin/Manager)
 */
export const getInviteCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Call service
    const code = await projectService.getOrCreateInviteCode(id);

    res.json({ success: true, code });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, message: "Invalid project ID" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    if (err.message === 'FAILED_TO_GENERATE_CODE') {
      return res.status(500).json({ success: false, message: "Failed to generate unique invite code after multiple retries." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Generate a new random invite code
 * @route   PATCH /projects/:id/invite-code
 * @access  Private (Admin/Manager)
 */
export const resetInviteCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Call service
    const newCode = await projectService.resetInviteCode(id);

    res.json({ 
      success: true, 
      message: "Invite code reset successfully", 
      code: newCode 
    });
  } catch (err) {
    // Handle service errors
    if (err.message === 'INVALID_PROJECT_ID') {
      return res.status(400).json({ success: false, message: "Invalid project ID" });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    if (err.message === 'FAILED_TO_RESET_CODE') {
      return res.status(500).json({ success: false, message: "Failed to reset invite code after multiple retries." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Allow user to join a project using an invite code
 * @route   POST /projects/join
 * @access  Private (Member)
 */
export const joinProjectByCode = async (req, res) => {
  try {
    // 1. Validate input
    const validation = projectValidator.validateJoinByCode(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError",
        errors: validation.errors 
      });
    }

    const { inviteCode } = req.body;
    const userId = req.user._id;

    // 2. Call service
    const projectId = await projectService.joinProjectByCode(inviteCode, userId);

    // 3. Return response
    res.json({ 
      success: true, 
      message: "Successfully joined project", 
      projectId 
    });
  } catch (err) {
    // 4. Handle service errors
    if (err.message === 'INVALID_INVITE_CODE') {
      return res.status(400).json({ success: false, message: "Invalid invite code format" });
    }
    if (err.message === 'INVALID_OR_EXPIRED_CODE') {
      return res.status(404).json({ success: false, message: "Invalid or expired invite code." });
    }
    if (err.message === 'ALREADY_MEMBER') {
      return res.status(400).json({ success: false, message: "You are already a member of this project." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};