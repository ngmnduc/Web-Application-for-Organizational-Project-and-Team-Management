import Project from "../models/project.model.js";
import Label from "../models/label.model.js"; // <--- Import Model Label
import mongoose from "mongoose";

// GET /projects/:id/labels
export const getLabels = async (req, res) => {
  try {
    const { id } = req.params; // id là ProjectId
    
    // Validate ProjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    
    // 1. Logic Mới: Tìm trực tiếp trong bảng Label
    const labels = await Label.find({ 
      projectId: id, 
      deletedAt: null 
    }).sort({ createdAt: 1 }); // Sắp xếp label cũ nhất lên trước

    res.json({ success: true, data: labels });
  } catch (err) {
    console.error("Get Labels Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /projects/:id/labels
export const createLabel = async (req, res) => {
  try {
    const { id } = req.params; // id là ProjectId
    const { name, color } = req.body || {};
    
    // Validate
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    if (!name) return res.status(400).json({ success: false, error: "ValidationError", message: "Label name is required" });

    // 1. Phải tìm Project trước để lấy organizationId (Model Label bắt buộc trường này)
    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    // 2. Logic Mới: Tạo record trong bảng Label
    const newLabel = await Label.create({
      name: name.trim(),
      color: color || "#3b82f6",
      projectId: id,
      organizationId: project.organizationId, // Lấy từ project
      deletedAt: null
    });

    res.status(201).json({ 
      success: true, 
      message: "Label created", 
      data: newLabel
    });

  } catch (err) {
    console.error("Create Label Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /projects/:id/labels/:labelId
export const updateLabel = async (req, res) => {
  try {
    const { id, labelId } = req.params;
    const { name, color } = req.body || {};
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(labelId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid ID format" });
    }

    // 1. Logic Mới: Update trực tiếp vào bảng Label
    const label = await Label.findOne({ _id: labelId, projectId: id, deletedAt: null });
    
    if (!label) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Label not found" });
    }

    if (name) label.name = name.trim();
    if (color) label.color = color;
    
    await label.save();

    res.json({ success: true, message: "Label updated", data: label });

  } catch (err) {
    console.error("Update Label Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /projects/:id/labels/:labelId
export const deleteLabel = async (req, res) => {
  try {
    const { id, labelId } = req.params;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(labelId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid ID format" });
    }

    // 1. Logic Mới: Soft delete (vì model có deletedAt) hoặc Hard delete
    // Ở đây tôi dùng Soft Delete để khớp với schema
    const label = await Label.findOneAndUpdate(
      { _id: labelId, projectId: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!label) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Label not found" });
    }

    res.json({ success: true, message: "Label deleted" });

  } catch (err) {
    console.error("Delete Label Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};