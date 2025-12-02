import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// GET /projects/:id/members?page=1&limit=10
export const getMembers = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: "ValidationError", 
        message: "Invalid project ID format" 
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100, default 10

    const project = await Project.findById(id).populate("members.user", "name email role");
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    // Filter out members with null user (deleted users)
    const activeMembers = project.members.filter(m => m.user != null);

    // Paginate members
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMembers = activeMembers.slice(startIndex, endIndex);

    const membersData = paginatedMembers.map(m => ({
      _id: m._id,
      user: { id: m.user._id, name: m.user.name, email: m.user.email, role: m.user.role },
      role: m.role,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    res.json({
      success: true,
      page,
      limit,
      total: activeMembers.length,
      data: membersData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// POST /projects/:id/members (Admin/Manager push add member)
export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body || {};
    
    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    if (!userId) return res.status(400).json({ success: false, error: "ValidationError", message: "userId is required" });
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid user ID format" });
    }

    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    // Check user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "NotFoundError", message: "User not found" });

    // Check if already member
    const existing = project.members.find(m => String(m.user) === String(userId));
    if (existing) return res.status(409).json({ success: false, error: "ConflictError", message: "User is already a member" });

    project.members.push({ user: userId, role: role || "Member", status: "ACTIVE" });
    await project.save();
    
    // Populate user data before returning
    await project.populate("members.user", "name email role");
    const addedMember = project.members[project.members.length - 1];
    
    const memberData = {
      _id: addedMember._id,
      user: {
        id: addedMember.user._id,
        name: addedMember.user.name,
        email: addedMember.user.email,
        role: addedMember.user.role
      },
      role: addedMember.role,
      status: addedMember.status,
      createdAt: addedMember.createdAt,
      updatedAt: addedMember.updatedAt
    };

    res.status(201).json({ success: true, message: "Member added", data: memberData });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// DELETE /projects/:id/members/:memberId
export const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    
    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid member ID format" });
    }

    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    project.members.pull({ _id: memberId });
    await project.save();

    res.json({ success: true, message: "Member removed" });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// POST /projects/:id/join (User requests to join)
export const joinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ success: false, error: "AuthenticationError", message: "Unauthorized" });

    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    // Check if already member
    const existing = project.members.find(m => String(m.user) === String(userId));
    if (existing) {
      return res.status(409).json({ success: false, error: "ConflictError", message: `Already a member with status: ${existing.status}` });
    }

    project.members.push({ user: userId, role: "Member", status: "PENDING" });
    await project.save();

    res.status(201).json({ success: true, message: "Join request submitted", data: { status: "PENDING" } });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PATCH /projects/:projectId/members/:memberId/approve
export const approveMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { action } = req.body || {}; // "approve" or "reject"
    
    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid member ID format" });
    }

    const project = await Project.findById(projectId);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    const member = project.members.id(memberId);
    if (!member) return res.status(404).json({ success: false, error: "NotFoundError", message: "Member not found" });

    let statusMessage;
    if (action === "approve") {
      member.status = "ACTIVE";
      statusMessage = "Member request has been approved";
    } else if (action === "reject") {
      member.status = "REJECTED";
      statusMessage = "Member request has been rejected";
    } else {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid action. Use 'approve' or 'reject'" });
    }

    await project.save();

    res.json({ success: true, message: statusMessage, data: member });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};
