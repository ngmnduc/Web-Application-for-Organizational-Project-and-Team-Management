/**
 * Project Service Layer
 * Business logic for project management (Updated to use ProjectMember model)
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
 * Create new project (UPDATED: Using ProjectMember model)
 */
export const createProject = async (projectData, creatorId, currentOrganizationId) => {
  const { name, description, deadline, manager, startDate, endDate } = projectData;

  // Validation
  if (!name?.trim()) {
    throw new Error('PROJECT_NAME_REQUIRED');
  }

  // Auto-promote manager if specified
  if (manager && manager !== creatorId.toString()) {
    const userToPromote = await User.findById(manager);
    if (userToPromote && userToPromote.role === "Member") {
      userToPromote.role = "Manager";
      await userToPromote.save();
      console.log(`Auto-promoted user ${userToPromote.email} to Manager`);
    }
  }

  // Create project WITHOUT embedded members
  const project = new Project({
    name: name.trim(),
    description: description?.trim() || "",
    startDate: startDate || null,
    endDate: endDate || null,
    deadline: deadline || null,
    createdBy: creatorId,
    organizationId: currentOrganizationId,
    inviteCode: generateRandomCode(),
  });

  await project.save();

  //  Add creator as Manager in ProjectMember table
  await ProjectMember.create({
    projectId: project._id,
    userId: creatorId,
    roleInProject: "Manager",
    status: "ACTIVE"
  });

  //  Add specified manager if different from creator
  if (manager && manager !== creatorId.toString()) {
    await ProjectMember.create({
      projectId: project._id,
      userId: manager,
      roleInProject: "Manager",
      status: "ACTIVE"
    });
  }

  // Log activity
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId: creatorId,
      action: "CREATE_PROJECT",
      content: `Created project "${name.trim()}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Get all projects (UPDATED: Filter by user's projects through ProjectMember)
 */
export const listProjects = async (filters = {}) => {
  const { userId, status, archived, page = 1, limit = 20 } = filters;

  //  Get user's projects through ProjectMember
  let projectIds = [];
  if (userId) {
    const userProjects = await ProjectMember.find({ 
      userId, 
      status: "ACTIVE" 
    }).distinct("projectId");
    projectIds = userProjects;
  }

  const query = { deletedAt: null };
  
  //  Filter by user's projects
  if (userId && projectIds.length > 0) {
    query._id = { $in: projectIds };
  } else if (userId && projectIds.length === 0) {
    // User has no projects
    return {
      projects: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0,
      },
    };
  }

  // Apply other filters
  if (status) {
    query.status = status;
  }

  if (archived !== undefined) {
    query.status = archived === 'true' ? 'archived' : { $ne: 'archived' };
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const projects = await Project.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Project.countDocuments(query);

  return {
    projects,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get single project by ID (UPDATED: Include members from ProjectMember)
 */
export const getProjectById = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId)
    .populate('createdBy', 'name email');

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Get members from ProjectMember table
  const members = await ProjectMember.find({ projectId, status: "ACTIVE" })
    .populate("userId", "name email avatar")
    .select("roleInProject createdAt");

  // Combine project with members
  const projectWithMembers = {
    ...project.toObject(),
    members: members.map(m => ({
      userId: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      avatar: m.userId.avatar,
      role: m.roleInProject,
      joinedAt: m.createdAt
    }))
  };

  return projectWithMembers;
};

/**
 * Update project (Enhanced with validation)
 */
export const updateProject = async (projectId, updateData, userId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  // Update fields with validation
  if (updateData.name?.trim()) project.name = updateData.name.trim();
  if (updateData.description !== undefined) project.description = updateData.description?.trim() || "";
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
      content: `Updated project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Delete project (soft delete) - Enhanced with logging
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
      content: `Deleted project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Toggle project archive status
 */
export const toggleArchive = async (projectId, userId, archive) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const project = await Project.findById(projectId);

  if (!project || project.deletedAt) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  project.status = archive ? "archived" : "active";
  await project.save();

  // Log activity
  const action = archive ? "ARCHIVE_PROJECT" : "UNARCHIVE_PROJECT";
  try {
    await ActivityLog.create({
      projectId: project._id,
      userId,
      action,
      content: `${archive ? 'Archived' : 'Unarchived'} project "${project.name}"`,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }

  return project;
};

/**
 * Get project members (UPDATED: From ProjectMember table)
 */
export const getProjectMembers = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  // Query from ProjectMember table
  const members = await ProjectMember.find({ projectId })
    .populate("userId", "name email avatar")
    .select("roleInProject status createdAt");

  // Format data
  const formattedMembers = members.map((m) => {
    if (!m.userId) return null;

    return {
      userId: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      avatar: m.userId.avatar,
      projectRole: m.roleInProject,
      status: m.status,
      joinedAt: m.createdAt
    };
  }).filter(m => m !== null);

  return formattedMembers;
};

/**
 * Add member to project (UPDATED: Using ProjectMember model)
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

  // Check if user already exists in ProjectMember
  const existingMember = await ProjectMember.findOne({
    projectId,
    userId
  });

  if (existingMember) {
    throw new Error('USER_ALREADY_MEMBER');
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Add member to ProjectMember table
  await ProjectMember.create({
    projectId,
    userId,
    roleInProject: role,
    status: "ACTIVE"
  });

  return { success: true, message: "Member added successfully" };
};

/**
 * Remove member from project (UPDATED: Using ProjectMember model)
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

  // Remove member from ProjectMember table
  const result = await ProjectMember.findOneAndDelete({
    projectId,
    userId
  });

  if (!result) {
    throw new Error('MEMBER_NOT_FOUND');
  }

  return { success: true, message: "Member removed successfully" };
};

/**
 * Get project summary (Enhanced with more stats)
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

  // Get comprehensive task statistics
  const [totalTasks, todo, doing, done, overdue, high, medium, low] = await Promise.all([
    Task.countDocuments({ projectId, deletedAt: null }),
    Task.countDocuments({ projectId, status: "TODO", deletedAt: null }),
    Task.countDocuments({ projectId, status: "DOING", deletedAt: null }),
    Task.countDocuments({ projectId, status: "DONE", deletedAt: null }),
    Task.countDocuments({
      projectId,
      deletedAt: null,
      dueDate: { $lt: now },
      status: { $ne: "DONE" }
    }),
    Task.countDocuments({ projectId, priority: "HIGH", deletedAt: null }),
    Task.countDocuments({ projectId, priority: "MEDIUM", deletedAt: null }),
    Task.countDocuments({ projectId, priority: "LOW", deletedAt: null }),
  ]);

  // Calculate days left
  let daysLeft = 0;
  const endDateField = project.endDate || project.deadline;
  if (endDateField) {
    const end = new Date(endDateField);
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
  };
};

/**
 * Get project activities
 */
export const getProjectActivities = async (projectId, options = {}) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  const { page = 1, limit = 10 } = options;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const total = await ActivityLog.countDocuments({ projectId });

  const activities = await ActivityLog.find({ projectId })
    .populate("userId", "name email avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  return {
    activities,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * Get pending member requests
 */
export const getPendingRequests = async () => {
  const pendingRequests = await ProjectMember.find({ status: "PENDING" })
    .populate("projectId", "name")
    .populate("userId", "name email avatar");

  const data = pendingRequests.map(request => ({
    requestId: request._id,
    projectId: request.projectId._id,
    projectName: request.projectId.name,
    user: request.userId
  }));

  return data;
};

/**
 * Generate or get invite code
 */
export const getOrGenerateInviteCode = async (projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new Error('INVALID_PROJECT_ID');
  }

  let project = await Project.findById(projectId).select('+inviteCode');
  
  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  if (project.inviteCode) {
    return project.inviteCode;
  }

  // Generate new code
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
        console.warn(`Invite Code Race Condition detected. Retrying... Attempt ${i + 1}`);
        continue;
      }
      throw err;
    }
  }
  
  throw new Error('FAILED_TO_GENERATE_INVITE_CODE');
};

/**
 * Reset invite code
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

      if (!project) {
        throw new Error('PROJECT_NOT_FOUND');
      }
      
      return project.inviteCode;

    } catch (err) {
      if (err.code === 11000) {
        console.warn(`Reset Code Race Condition detected. Retrying... Attempt ${i + 1}`);
        continue;
      }
      throw err;
    }
  }
  
  throw new Error('FAILED_TO_RESET_INVITE_CODE');
};

/**
 * Join project by invite code
 */
export const joinProjectByCode = async (inviteCode, userId) => {
  if (!inviteCode) {
    throw new Error('INVITE_CODE_REQUIRED');
  }

  const normalizedCode = inviteCode.toUpperCase().trim();

  const project = await Project.findOne({ 
    inviteCode: normalizedCode, 
    deletedAt: null 
  });
  
  if (!project) {
    throw new Error('INVALID_INVITE_CODE');
  }

  const existingMember = await ProjectMember.findOne({
    projectId: project._id, 
    userId: userId
  });
  
  if (existingMember) {
    throw new Error('ALREADY_JOINED');
  }

  await ProjectMember.create({
    projectId: project._id,
    userId: userId,
    roleInProject: "Member",
    status: "ACTIVE"
  });

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
  
  return project;
};

/**
 * Check if user is project member (UPDATED: Check ProjectMember table)
 */
export const isProjectMember = async (projectId, userId) => {
  const member = await ProjectMember.findOne({
    projectId,
    userId,
    status: "ACTIVE"
  });

  return !!member;
};

/**
 * Get user's role in project (UPDATED: Check ProjectMember table)
 */
export const getUserRoleInProject = async (projectId, userId) => {
  const member = await ProjectMember.findOne({
    projectId,
    userId,
    status: "ACTIVE"
  });

  return member ? member.roleInProject : null;
};
