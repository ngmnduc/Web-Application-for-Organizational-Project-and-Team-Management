import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// POST /projects
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (!name) return res.status(400).json({ message: "Project name is required" });

    const creatorId = req.user && req.user._id;
    if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

    const project = new Project({
      name,
      description,
      createdBy: creatorId,
      members: [{ user: creatorId, role: "Manager" }],
    });

    await project.save();
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /projects
export const listProjects = async (req, res) => {
  try {
    const projects = await Project.find({ deletedAt: null });
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /projects/:id
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });
    const project = await Project.findById(id).populate("members.user", "name email role");
    if (!project || project.deletedAt) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /projects/:id
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const project = await Project.findByIdAndUpdate(id, data, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /projects/:id (soft delete)
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, message: "Project deleted", data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /projects/:id/members -> return mock list if no populated members
export const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate("members.user", "name email role");
    if (!project) return res.status(404).json({ message: "Project not found" });

    // If members populated, map to public info
    const members = project.members.map((m) => ({ id: m.user?._id || m.user, name: m.user?.name || "Unknown", email: m.user?.email || "", role: m.role }));

    // If empty, return a mock list
    if (!members.length) {
      return res.json({ success: true, data: [ { id: null, name: "Mock User", email: "mock@example.com", role: "Member" } ] });
    }

    res.json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
