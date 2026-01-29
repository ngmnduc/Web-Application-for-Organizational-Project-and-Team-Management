import ProjectMember from "../models/projectMember.model.js";

/**
 @param {...string} requiredProjectRoles - Array of allowed project 
 */
export function verifyProjectAccess(...requiredProjectRoles) {
  return async (req, res, next) => {
    try {
      //Extract projectId from various sources
      let projectId = req.params.id || req.params.projectId;

      if (!projectId && req.params.taskId) {
        const Task = (await import("../models/task.model.js")).default;
        const task = await Task.findById(req.params.taskId).select('projectId');
        if (!task) {
          return res.status(404).json({ 
            success: false, 
            error: "NotFoundError",
            message: "Task not found" 
          });
        }
        projectId = task.projectId.toString();
      }

      // If dealing with meeting routes (GET/PATCH/DELETE /meetings/:id)
      if (!projectId && req.params.id && req.path.includes('/meetings/')) {
        const Meeting = (await import("../models/meeting.model.js")).default;
        const meeting = await Meeting.findById(req.params.id).select('projectId');
        if (!meeting) {
          return res.status(404).json({ 
            success: false, 
            error: "NotFoundError",
            message: "Meeting not found" 
          });
        }
        projectId = meeting.projectId.toString();
      }

      // If still no projectId, try from request body
      if (!projectId && req.body.projectId) {
        projectId = req.body.projectId;
      }

      if (!projectId) {
        return res.status(400).json({ 
          success: false, 
          error: "BadRequestError",
          message: "Project ID is required" 
        });
      }

      //Get userId from token (set by verifyToken middleware)
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: "UnauthorizedError",
          message: "User not authenticated" 
        });
      }

      //GHOST USER CHECK - Verify user still exists and is active
      const User = (await import("../models/user.model.js")).default;
      const user = await User.findById(userId).select('deletedAt status');
      
      if (!user || user.deletedAt !== null) {
        return res.status(403).json({ 
          success: false, 
          error: "ForbiddenError",
          message: "User account has been deleted" 
        });
      }
      
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ 
          success: false, 
          error: "ForbiddenError",
          message: "User account is not active" 
        });
      }

      //Query ProjectMember table
      const projectMember = await ProjectMember.findOne({ 
        projectId, 
        userId,
        status: "ACTIVE" // Only check active members
      });

      //Check if user is a member of the project
      if (!projectMember) {
        return res.status(403).json({ 
          success: false, 
          error: "ForbiddenError",
          message: "You are not a member of this project" 
        });
      }

      //Attach project role to request
      req.projectRole = projectMember.roleInProject;
      req.projectId = projectId;

      //Verify role permissions
      if (requiredProjectRoles.length > 0 && !requiredProjectRoles.includes(req.projectRole)) {
        return res.status(403).json({ 
          success: false, 
          error: "ForbiddenError",
          message: `Insufficient permissions. Required roles: ${requiredProjectRoles.join(', ')}. Your role: ${req.projectRole}` 
        });
      }

      // All checks passed
      next();
    } catch (err) {
      return res.status(500).json({ 
        success: false, 
        error: "ServerError",
        message: err.message 
      });
    }
  };
}

/**
 * Middleware: Check if user is a project member (any role)
 * Simplified version that only checks membership without role requirements
 */
export function requireProjectMember(req, res, next) {
  return verifyProjectAccess()(req, res, next);
}

/**
 * Middleware: Only Project Managers and Admins
 */
export function requireProjectManager(req, res, next) {
  return verifyProjectAccess('Admin', 'Manager')(req, res, next);
}

/**
 * Middleware: Only Project Admins
 */
export function requireProjectAdmin(req, res, next) {
  return verifyProjectAccess('Admin')(req, res, next);
}
