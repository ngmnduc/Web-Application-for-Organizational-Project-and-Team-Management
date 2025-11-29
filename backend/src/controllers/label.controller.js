import Project from "../models/project.model.js";
import mongoose from "mongoose";

// GET /projects/:id/labels
export const getLabels = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    
    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }
    res.json({ success: true, data: project.labels || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /projects/:id/labels
export const createLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body || {};
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    if (!name) return res.status(400).json({ success: false, error: "ValidationError", message: "Label name is required" });

    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    project.labels.push({ name, color: color || "#3b82f6" });
    await project.save();
    
    const createdLabel = project.labels[project.labels.length - 1];

    res.status(201).json({ 
      success: true, 
      message: "Label created", 
      data: {
        _id: createdLabel._id,
        name: createdLabel.name,
        color: createdLabel.color,
        createdAt: createdLabel.createdAt,
        updatedAt: createdLabel.updatedAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /projects/:id/labels/:labelId
export const updateLabel = async (req, res) => {
  try {
    const { id, labelId } = req.params;
    const { name, color } = req.body || {};
    
    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid label ID format" });
    }

    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    const label = project.labels.id(labelId);
    if (!label) return res.status(404).json({ success: false, error: "NotFoundError", message: "Label not found" });

    if (name) label.name = name;
    if (color) label.color = color;
    await project.save();

    res.json({ success: true, message: "Label updated", data: label });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /projects/:id/labels/:labelId
export const deleteLabel = async (req, res) => {
  try {
    const { id, labelId } = req.params;
    
    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid label ID format" });
    }

    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    project.labels.pull({ _id: labelId });
    await project.save();

    res.json({ success: true, message: "Label deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
