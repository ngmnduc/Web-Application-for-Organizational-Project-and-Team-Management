/**
 * Project Service Layer
 * Business logic for project management
 */

import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import ActivityLog from "../models/activityLog.model.js";

/**
 * Generate random project code
 */
const generateRandomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Create new project (BE1 Multi-tenant with ProjectMember model)
 */
export const createProject = async (projectData, creatorId, currentOrganizationId) => {
  const { name, description, deadline, manager, startDate, endDate } = projectData;

  // Validate organization exists
  if (!currentOrganizationId) {
    throw new Error('ORGANIZATION_REQUIRED');
  }

  // Auto-promote manager if specified
  if (manager && manager !== creatorId.toString()) {
    const userToPromote = await User.findById(manager);
    if (userToPromote && userToPromote.role === "Member") {
      userToPromote.role = "Manager";
      await userToPromote.save();
      console.log(`✅ Auto-promoted user ${userToPromote.email} to Manager`);
    }
    
    // Validate manager belongs to same organization
    if (userToPromote && userToPromote.currentOrganizationId?.toString() !== currentOrganizationId.toString()) {
      throw new Error('MANAGER_NOT_IN_ORGANIZATION');
    }
  }

  // Step 1: Create and save Project (with organizationId)
  const project = new Project({
    name: name.trim(),
    description: description?.trim() || "",
    organizationId: currentOrganizationId,
    startDate: startDate || null,
    endDate: endDate || null,
    deadline: deadline || null,
    createdBy: creatorId,
    members: [], // Empty array - use ProjectMember table instead
    code: generateRandomCode(),
  });

  await project.save();

  // Step 2: Get project._id
  const projectId = project._id;

  // Step 3: Create ProjectMember records (Creator as Admin, Manager if specified)
  const projectMembers = [
    {
      organizationId: currentOrganizationId,
      projectId: projectId,
      userId: creatorId,
      roleInProject: "Admin",
      status: "ACTIVE"
    }
  ];

  if (manager && manager !== creatorId.toString()) {
    projectMembers.push({
      organizationId: currentOrganizationId,
      projectId: projectId,
      userId: manager,
      roleInProject: "Manager",
      status: "ACTIVE"
    });
  }

  // Use insertMany for optimization
  await ProjectMember.insertMany(projectMembers);

  // Step 4: Log activity
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId: creatorId,
      action: "CREATE_PROJECT",
      description: `Created project "${name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Get all projects (with filters)
 */
export const listProjects = async (filters = {}) => {
  const query = { deletedAt: null };

  // Apply organizationId filter (required)
  if (filters.organizationId) {
    query.organizationId = filters.organizationId;
  }

  // Apply other filters
  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.archived !== undefined) {
    query.isArchived = filters.archived === 'true';
  }

  if (filters.userId) {
    query['members.user'] = filters.userId;
  }

  // Pagination
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const projects = await Project.find(query)
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Project.countDocuments(query);

  return {
    projects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single project by ID
 */
export const getProjectById = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId)
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email role avatar');

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  return project;
};

/**
 * Update project
 */
export const updateProject = async (projectId, updateData, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Update fields
  if (updateData.name) project.name = updateData.name.trim();
  if (updateData.description !== undefined) project.description = updateData.description.trim();
  if (updateData.startDate !== undefined) project.startDate = updateData.startDate;
  if (updateData.endDate !== undefined) project.endDate = updateData.endDate;
  if (updateData.deadline !== undefined) project.deadline = updateData.deadline;
  if (updateData.status) project.status = updateData.status;

  await project.save();

  // Log activity
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId,
      action: "UPDATE_PROJECT",
      description: `Updated project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Delete project (soft delete)
 */
export const deleteProject = async (projectId, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  project.deletedAt = new Date();
  await project.save();

  // Log activity
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId,
      action: "DELETE_PROJECT",
      description: `Deleted project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Toggle project archive status
 */
export const toggleArchive = async (projectId, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  project.isArchived = !project.isArchived;
  await project.save();

  // Log activity
  const action = project.isArchived ? "ARCHIVE_PROJECT" : "UNARCHIVE_PROJECT";
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId,
      action,
      description: `${project.isArchived ? 'Archived' : 'Unarchived'} project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Add member to project
 */
export const addMember = async (projectId, userId, role = "Member") => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('INVALID_USER_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Check if user already exists
  const existingMember = project.members.find(
    m => m.user.toString() === userId.toString()
  );

  if (existingMember) {
    throw new Error('USER_ALREADY_MEMBER');
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Add member
  project.members.push({
    user: userId,
    role,
    status: "ACTIVE",
  });

  await project.save();

  return project;
};

/**
 * Remove member from project
 */
export const removeMember = async (projectId, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new Error('INVALID_USER_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Cannot remove creator
  if (project.createdBy.toString() === userId.toString()) {
    throw new Error('CANNOT_REMOVE_CREATOR');
  }

  // Remove member
  project.members = project.members.filter(
    m => m.user.toString() !== userId.toString()
  );

  await project.save();

  return project;
};

/**
 * Get project summary (stats)
 */
export const getProjectSummary = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  const now = new Date();

  // Get task statistics in parallel
  const [totalTasks, todo, doing, done, high, medium, low, overdue] = await Promise.all([
    Task.countDocuments({ projectId, deletedAt: null }),
    Task.countDocuments({ projectId, status: 'TODO', deletedAt: null }),
    Task.countDocuments({ projectId, status: 'DOING', deletedAt: null }),
    Task.countDocuments({ projectId, status: 'DONE', deletedAt: null }),
    Task.countDocuments({ projectId, priority: 'HIGH', deletedAt: null }),
    Task.countDocuments({ projectId, priority: 'MEDIUM', deletedAt: null }),
    Task.countDocuments({ projectId, priority: 'LOW', deletedAt: null }),
    Task.countDocuments({
      projectId,
      deletedAt: null,
      dueDate: { $lt: now },
      status: { $ne: 'DONE' }
    })
  ]);

  // Calculate days left
  let daysLeft = 0;
  if (project.deadline) {
    const end = new Date(project.deadline);
    const diffTime = end - now;
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) daysLeft = 0;
  }

  return {
    totalTasks,
    todo,
    doing,
    done,
    overdue,
    daysLeft,
    priority: { high, medium, low },
    tasksByStatus: [
      { _id: 'TODO', count: todo },
      { _id: 'DOING', count: doing },
      { _id: 'DONE', count: done }
    ]
  };
};

/**
 * Get project activities
 */
export const getProjectActivities = async (projectId, limit = 20) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const activities = await ActivityLog.find({ projectId })
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(limit);

  return activities;
};

/**
 * Check if user is project member
 */
export const isProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    return false;
  }

  return project.members.some(
    m => m.user.toString() === userId.toString() && m.status === 'ACTIVE'
  );
};

/**
 * Get user's role in project
 */
export const getUserRoleInProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    return null;
  }

  const member = project.members.find(
    m => m.user.toString() === userId.toString()
  );

  return member ? member.role : null;
};

/**
 * Get project members from ProjectMember table
 */
export const getProjectMembers = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const ProjectMember = mongoose.model('ProjectMember');
  
  const members = await ProjectMember.find({ projectId })
    .populate('userId', 'name email avatar');

  const formattedData = members.map((m) => {
    if (!m.userId) return null;

    return {
      userId: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      projectRole: m.roleInProject,
      status: m.status,
      joinedAt: m.createdAt
    };
  }).filter(m => m !== null);

  return formattedData;
};

/**
 * Get pending join requests across all projects
 */
export const getPendingRequests = async () => {
  const projects = await Project.find({ "members.status": "PENDING" })
    .select("name members")
    .populate("members.user", "name email avatar");

  let pendingList = [];

  projects.forEach(proj => {
    const pendingMembers = proj.members.filter(m => m.status === "PENDING");
    
    pendingMembers.forEach(member => {
      pendingList.push({
        requestId: member._id,
        projectId: proj._id,
        projectName: proj.name,
        user: member.user
      });
    });
  });

  return pendingList;
};

/**
 * Get or generate invite code for project
 */
export const getOrCreateInviteCode = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  let project = await Project.findById(projectId).select('+inviteCode');
  
  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  if (project.inviteCode) {
    return project.inviteCode;
  }

  // Generate new code with retry logic
  for (let i = 0; i < 5; i++) {
    try {
      let newCode;
      do {
        newCode = generateRandomCode(6);
      } while (await Project.findOne({ inviteCode: newCode }));
      
      project.inviteCode = newCode;
      await project.save();
      return newCode;

    } catch (err) {
      if (err.code === 11000) {
        console.warn(`Invite Code Race Condition for project ${projectId}. Retry ${i + 1}`);
        continue;
      }
      throw err;
    }
  }
  
  throw new Error('FAILED_TO_GENERATE_CODE');
};

/**
 * Reset invite code for project
 */
export const resetInviteCode = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  for (let i = 0; i < 5; i++) {
    try {
      let newCode;
      do {
        newCode = generateRandomCode(6);
      } while (await Project.findOne({ inviteCode: newCode }));

      const project = await Project.findByIdAndUpdate(
        projectId,
        { inviteCode: newCode },
        { new: true, select: '+inviteCode' }
      );

      if (!project || project.deletedAt) {
        throw new Error('PROJECT_NOT_FOUND');
      }

      return newCode;

    } catch (err) {
      if (err.code === 11000) {
        console.warn(`Reset Code Race Condition for project ${projectId}. Retry ${i + 1}`);
        continue;
      }
      throw err;
    }
  }
  
  throw new Error('FAILED_TO_RESET_CODE');
};

/**
 * Join project using invite code
 */
export const joinProjectByCode = async (inviteCode, userId) => {
  if (!inviteCode || typeof inviteCode !== 'string') {
    throw new Error('INVALID_INVITE_CODE');
  }

  const normalizedCode = inviteCode.toUpperCase().trim();

  const project = await Project.findOne({ 
    inviteCode: normalizedCode, 
    deletedAt: null 
  });
  
  if (!project) {
    throw new Error('INVALID_OR_EXPIRED_CODE');
  }

  // Check if already a member
  const existingMember = project.members.find(
    m => m.user.toString() === userId.toString()
  );

  if (existingMember) {
    throw new Error('ALREADY_MEMBER');
  }

  // Add user as member
  project.members.push({
    user: userId,
    role: "Member",
    status: "ACTIVE"
  });

  await project.save();

  // Log activity
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId: userId,
      action: "JOIN_PROJECT",
      content: `joined project "${project.name}" using invite code.`
    });
  } catch (e) {
    console.error("Logging failed:", e.message);
  }
  
  return project._id;
};
