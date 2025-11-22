import Project from "../models/project.model.js";

// Middleware to check if project is active (not archived)
export async function checkProjectActive(req, res, next) {
  try {
    // Extract project ID from params (could be :id or :projectId)
    const projectId = req.params.id || req.params.projectId;
    
    if (!projectId) {
      return next(); // No project ID, skip check
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    if (project.status === "archived") {
      return res.status(403).json({ 
        success: false, 
        message: "Cannot modify archived project" 
      });
    }

    // Attach project to request for later use
    req.project = project;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
