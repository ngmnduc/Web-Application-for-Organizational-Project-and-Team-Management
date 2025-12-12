import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import ActivityLog from "../models/activityLog.model.js";
import Organization from "../models/organization.model.js";

const generateRandomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// POST /projects
export const createProject = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, description, deadline, icon, color } = req.body || {};
    const currentOrgId = req.user.currentOrganizationId;
    const userId = req.user._id;

    if (!name) return res.status(400).json({ success: false, message: "Project name is required" });
    if (!currentOrgId) return res.status(400).json({ success: false, message: "Organization context missing" });

    // 1. Check Organization Plan & Limits
    const organization = await Organization.findById(currentOrgId);
    if (!organization) return res.status(404).json({ message: "Organization not found" });

    if (organization.plan === "FREE") {
      const projectCount = await Project.countDocuments({ 
          organizationId: currentOrgId,
          deletedAt: null 
      });
      
      if (projectCount >= 1) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          error: "PlanLimitReached",
          message: "Free plan limit reached (Max 1 Project). Please upgrade to Premium.",
        });
      }
    }

    // 2. Create Project
    const [project] = await Project.create([{
      name,
      description,
      deadline: deadline || null,
      createdBy: userId,
      organizationId: currentOrgId,
    }], { session });

    // 3. Add Creator as Admin in ProjectMember
    await ProjectMember.create([{
        projectId: project._id,
        userId: userId,
        roleInProject: "Admin", 
        status: "ACTIVE"
    }], { session });

    await session.commitTransaction();
    
    try {
        await ActivityLog.create({
            projectId: project._id,
            userId: userId,
            action: "CREATE_PROJECT",
            content: `created project "${name}"`
        });
    } catch(e) {}

    res.status(201).json({ success: true, message: "Project created successfully", data: project });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  } finally {
    session.endSession();
  }
};

// GET /projects
export const listProjects = async (req, res) => {
  try {
    const currentOrgId = req.user.currentOrganizationId;
    if (!currentOrgId) return res.status(200).json({ success: true, count: 0, data: [] });

    const projects = await Project.find({ 
        organizationId: currentOrgId, 
        deletedAt: null 
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects/:id
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    
    const project = await Project.findOne({ 
        _id: id, 
        organizationId: currentOrgId, 
        deletedAt: null 
    });
    
    if (!project) return res.status(404).json({ success: false, message: "Project not found or access denied" });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PUT /projects/:id
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;
    const data = req.body || {};

    const project = await Project.findOneAndUpdate(
        { _id: id, organizationId: currentOrgId, deletedAt: null },
        data, 
        { new: true }
    );

    if (!project) return res.status(404).json({ success: false, message: "Project not found or access denied" });
    res.json({ success: true, message: "Project updated successfully", data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// DELETE /projects/:id
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    const project = await Project.findOneAndUpdate(
        { _id: id, organizationId: currentOrgId, deletedAt: null },
        { deletedAt: new Date() }, 
        { new: true }
    );

    if (!project) return res.status(404).json({ success: false, message: "Project not found or access denied" });
    res.json({ success: true, message: "Project deleted", data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects/:id/members
export const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params; 
    const currentOrgId = req.user.currentOrganizationId;

    const project = await Project.findOne({ 
        _id: id, 
        organizationId: currentOrgId, 
        deletedAt: null 
    });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const members = await ProjectMember.find({ projectId: id })
      .populate("userId", "name email avatar");

    const formattedData = members.map((m) => {
        if (!m.userId) return null;
        return {
            _id: m._id,                 
            userId: m.userId._id,        
            name: m.userId.name,         
            email: m.userId.email,   
            avatar: m.userId.avatar,    
            role: m.roleInProject,      
            status: m.status,            
            joinedAt: m.createdAt
        };
    }).filter(m => m !== null);

    res.status(200).json({ success: true, data: formattedData });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// PATCH /projects/:id/archive
export const toggleArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive } = req.body || {}; 
    const currentOrgId = req.user.currentOrganizationId;

    const project = await Project.findOne({ 
        _id: id, 
        organizationId: currentOrgId, 
        deletedAt: null 
    });

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    project.status = archive ? "archived" : "active";
    await project.save();

    res.json({ success: true, message: `Project ${archive ? "archived" : "unarchived"}`, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /projects/:id/summary
export const getProjectSummary = async (req, res) => {
  try {
    const {id} = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    const project = await Project.findOne({ 
        _id: id, 
        organizationId: currentOrgId, 
        deletedAt: null 
    });

    if(!project) return res.status(404).json({success:false, message: "Project not found"});

    const now = new Date();

    const [totalTasks, todo , doing , done , overdue, high, medium, low] = await Promise.all([
      Task.countDocuments({projectId: id, deletedAt: null}),
      Task.countDocuments({projectId: id, status: "TODO", deletedAt: null}),
      Task.countDocuments({projectId: id, status: "DOING", deletedAt: null}),
      Task.countDocuments({projectId: id, status: "DONE", deletedAt: null}),
      Task.countDocuments({ projectId: id, priority: "HIGH", deletedAt: null }),
      Task.countDocuments({ projectId: id, priority: "MEDIUM", deletedAt: null }),
      Task.countDocuments({ projectId: id, priority: "LOW", deletedAt: null }),
      Task.countDocuments({
        projectId : id,
        deletedAt: null,
        dueDate: { $lt: now},
        status: { $ne: "DONE" }
      })
    ]);

    let daysLeft = 0;
    if (project.deadline) {
        const end = new Date(project.deadline);
        const diffTime = end - now;
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) daysLeft = 0;
    }

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        todo, doing, done, overdue,
        daysLeft,
        priority: { high, medium, low },
        tasksByStatus: [
            { _id: 'TODO', count: todo },
            { _id: 'DOING', count: doing },
            { _id: 'DONE', count: done }
        ]
      }
    });
  } catch (error){
    res.status(500).json({success:false, error: "ServerError", message: error.message});
  }
};

// GET /projects/:id/activities
export const getProjectActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    const project = await Project.findOne({ 
        _id: id, 
        organizationId: currentOrgId, 
        deletedAt: null 
    });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const total = await ActivityLog.countDocuments({projectId: id});

    const activities = await ActivityLog.find({ projectId: id })
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      data: activities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "ServerError", message: error.message });
  }
};

// GET /projects/pending-requests
export const getPendingRequests = async (req, res) => {
  try {
    const currentOrgId = req.user.currentOrganizationId;
    
    const projectsInOrg = await Project.find({ organizationId: currentOrgId }).select('_id name');
    const projectIds = projectsInOrg.map(p => p._id);

    const pendingMembers = await ProjectMember.find({
        projectId: { $in: projectIds },
        status: "PENDING"
    }).populate("userId", "name email avatar")
      .populate("projectId", "name"); 

    const formattedList = pendingMembers.map(pm => {
        if(!pm.userId || !pm.projectId) return null;
        return {
            requestId: pm._id,
            projectId: pm.projectId._id,
            projectName: pm.projectId.name,
            user: {
                _id: pm.userId._id,
                name: pm.userId.name,
                email: pm.userId.email,
                avatar: pm.userId.avatar
            },
            createdAt: pm.createdAt
        };
    }).filter(item => item !== null);

    res.json({ success: true, data: formattedList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /projects/:id/invite-code
export const getInviteCode = async (req, res) => {
  try {
    const { id } = req.params;
    const currentOrgId = req.user.currentOrganizationId;

    let project = await Project.findOne({ 
        _id: id, 
        organizationId: currentOrgId, 
        deletedAt: null 
    }).select('+inviteCode');
    
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    if (project.inviteCode) {
      return res.json({ success: true, code: project.inviteCode });
    }

    for (let i = 0; i < 5; i++) {
        try {
            let newCode;
            do { newCode = generateRandomCode(6); } while (await Project.findOne({ inviteCode: newCode }));
            project.inviteCode = newCode;
            await project.save();
            return res.json({ success: true, code: newCode });
        } catch (err) {
            if (err.code === 11000) continue;
            throw err;
        }
    }
    return res.status(500).json({ success: false, message: "Failed to generate unique code." });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /projects/:id/invite-code (Reset)
export const resetInviteCode = async (req, res) => {
  const { id } = req.params;
  const currentOrgId = req.user.currentOrganizationId;

  for (let i = 0; i < 5; i++) {
      try {
          let newCode;
          do { newCode = generateRandomCode(6); } while (await Project.findOne({ inviteCode: newCode }));

          const project = await Project.findOneAndUpdate(
              { _id: id, organizationId: currentOrgId, deletedAt: null },
              { inviteCode: newCode },
              { new: true, select: '+inviteCode' }
          );

          if (!project) return res.status(404).json({ success: false, message: "Project not found" });
          return res.json({ success: true, message: "Invite code reset successfully", code: project.inviteCode });

      } catch (err) {
          if (err.code === 11000) continue;
          return res.status(500).json({ success: false, message: err.message });
      }
  }
  return res.status(500).json({ success: false, message: "Failed to reset invite code." });
};

// POST /projects/join
export const joinProjectByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) return res.status(400).json({ success: false, message: "Invite code is required" });

    const project = await Project.findOne({ inviteCode: inviteCode.toUpperCase().trim(), deletedAt: null });
    if (!project) return res.status(404).json({ success: false, message: "Invalid or expired invite code." });

    try {
        await ProjectMember.create({
            projectId: project._id,
            userId: userId,
            roleInProject: "Member",
            status: "ACTIVE" 
        });

        try {
            await ActivityLog.create({
                projectId: project._id,
                userId: userId,
                action: "JOIN_PROJECT",
                content: `joined project "${project.name}" via invite code.`
            });
        } catch (e) { }
        
        res.json({ success: true, message: "Successfully joined project", projectId: project._id });

    } catch (err) {
        if (err.code === 11000) {
            const existing = await ProjectMember.findOne({ projectId: project._id, userId: userId });
            if (existing && existing.status === 'PENDING') {
                return res.status(400).json({ message: "You already requested to join." });
            }
            return res.status(400).json({ message: "You are already a member of this project." });
        }
        throw err;
    }

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};