import Project from "../models/project.model.js";
import mongoose from "mongoose";

// Middleware to check if project is active (not archived)
export async function checkProjectActive(req, res, next) {
  try {
    // Extract project ID from params (could be :id or :projectId)
    const projectId = req.params.id || req.params.projectId;
    
    if (!projectId) {
      return next(); // No project ID, skip check
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ 
        success: false,
        error: "ValidationError",
        message: "Invalid project ID format" 
      });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: "NotFoundError",
        message: "Project not found" 
      });
    }

    // Check deletedAt first (soft delete)
    if (project.deletedAt) {
      return res.status(404).json({ 
        success: false,
        error: "NotFoundError",
        message: "Project not found" 
      });
    }

    // Then check archived status
    if (project.status === "archived") {
      return res.status(403).json({ 
        success: false,
        error: "ForbiddenError",
        message: "Action forbidden: Project is archived" 
      });
    }

    // Attach project to request for later use
    req.project = project;
    next();
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: "ServerError",
      message: err.message 
    });
  }
}
