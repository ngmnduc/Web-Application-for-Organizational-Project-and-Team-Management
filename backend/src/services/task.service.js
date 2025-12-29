import mongoose from "mongoose";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import ActivityLog from "../models/activityLog.model.js";
import AIService from "../services/ai.service.js";
import Label from "../models/label.model.js";
import ProjectMember from "../models/projectMember.model.js"; 

export const getTasksByProject = async (projectId) => {
  const projectExists = await Project.findById(projectId);
  if (!projectExists) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  const tasks = await Task.find({ projectId, deletedAt: null })
    .sort({ orderIndex: 1 })
    .populate("assigneeId", "name email role")
    .populate("projectId", "name")
    .populate("labels", "name color");

  return tasks;
};

export const getFilteredTasks = async (filters) => {
  const query = { deletedAt: null };
  
  if (filters.project) query.projectId = filters.project;
  if (filters.assignee) query.assigneeId = filters.assignee;
  if (filters.status) query.status = filters.status;

  const tasks = await Task.find(query)
    .sort({ orderIndex: 1 })
    .populate("assigneeId", "name email role")
    .populate("projectId", "name")
    .populate("labels", "name color");
      
  return tasks;
};



export const getTaskById = async (taskId, userId, userRole) => {
  //  DEBUG: Log input
  console.log(' [getTaskById] Input:', { taskId, userId, userRole });

  if (!mongoose.isValidObjectId(taskId)) {
    throw new Error('INVALID_TASK_ID');
  }

  const task = await Task.findById(taskId)
    .populate("assigneeId", "name email role")
    .populate("projectId", "name")
    .populate("labels", "name color");

  if (!task || task.deletedAt) {
    throw new Error('TASK_NOT_FOUND');
  }

  // DEBUG: Log task info
  console.log(' [getTaskById] Task found:', {
    taskId: task._id,
    projectId: task.projectId?._id || task.projectId
  });

  // Bỏ qua check membership nếu là System Admin
  if (userRole !== 'Admin') {
    const projectId = task.projectId?._id || task.projectId;
    
    // tìm theo projectId + userId
    // Sau đó check status riêng
    const membership = await ProjectMember.findOne({
      projectId: projectId,
      userId: userId
    });

    //  DEBUG: Log membership query
    console.log('[getTaskById] Membership query:', {
      projectId: projectId,
      userId: userId,
      found: !!membership,
      membershipData: membership ? {
        id: membership._id,
        status: membership.status,
        roleInProject: membership.roleInProject,
        role: membership.role
      } : null
    });

    // Check nếu không tìm thấy hoặc status không active
    if (!membership) {
      console.error('[getTaskById] No membership found');
      throw new Error('FORBIDDEN');
    }

    //  Check status linh hoạt  
    if (membership.status && membership.status !== 'ACTIVE') {
      console.error('[getTaskById] Membership not active:', membership.status);
      throw new Error('FORBIDDEN');
    }

    console.log(' [getTaskById] Membership valid');
  } else {
    console.log(' [getTaskById] User is System Admin, skipping membership check');
  }

  return task;
};

export const createTask = async (taskData, userId, projectId, currentOrganizationId) => {
  const {
    title, description, priority, status, assigneeId,
    startDate, dueDate, estimateHours, spentHours
  } = taskData;

  if (!title) throw new Error('TITLE_REQUIRED');
  
  if (!currentOrganizationId) throw new Error('ORGANIZATION_REQUIRED');

  const project = await Project.findById(projectId);
  if (!project) throw new Error('PROJECT_NOT_FOUND');

  if (project.organizationId && project.organizationId.toString() !== currentOrganizationId.toString()) {
      throw new Error('ORGANIZATION_MISMATCH');
  }

  const convertedAssigneeId = assigneeId ? new mongoose.Types.ObjectId(assigneeId) : null;

  let baseIndex = 5000;
  if (priority && (priority.toUpperCase() === 'HIGH')) baseIndex = 1000;
  if (priority && (priority.toUpperCase() === 'LOW')) baseIndex = 9000;
  const calculatedOrderIndex = baseIndex + ((Date.now() % 10000) / 10000);

  const task = new Task({
    title,
    description,
    priority: priority || 'Medium',
    status,
    assigneeId: convertedAssigneeId,
    startDate,
    dueDate,
    estimateHours,
    spentHours,
    orderIndex: calculatedOrderIndex,
    projectId: project._id,
    organizationId: currentOrganizationId
  });

  await task.save();

  try {
    await ActivityLog.create({
      projectId: task.projectId,
      userId: userId,
      taskId: task._id,
      action: "CREATE_TASK",
      content: `created task "${task.title}"`
    });
  } catch (logError) {
    console.error("Logging failed:", logError.message);
  }

  return task;
};

export const updateTask = async (taskId, updateData, currentUser) => {
  if (!mongoose.isValidObjectId(taskId)) {
    throw new Error('INVALID_TASK_ID');
  }

  const task = await Task.findById(taskId);
  if (!task) throw new Error('TASK_NOT_FOUND');

  //  Check membership và lấy PROJECT ROLE
  const projectId = task.projectId?._id || task.projectId;
  const userId = currentUser._id || currentUser.id;
  const userSystemRole = currentUser.role;

  let projectRole = 'Member'; // Default

  // System Admin bypass check membership nhưng vẫn có quyền cao nhất
  if (userSystemRole !== 'Admin') {
    const membership = await ProjectMember.findOne({
      projectId: projectId,
      userId: userId
    });

    if (!membership) {
      console.error('[updateTask] No membership found');
      throw new Error('FORBIDDEN');
    }

    if (membership.status && membership.status !== 'ACTIVE') {
      console.error(' [updateTask] Membership not active');
      throw new Error('FORBIDDEN');
    }

    // LẤY PROJECT ROLE TỪ MEMBERSHIP
    projectRole = membership.roleInProject || membership.role || 'Member';
    
    console.log('[updateTask] Permission check:', {
      userId,
      userSystemRole,
      projectRole,
      taskAssigneeId: task.assigneeId
    });

    // Check quyền dựa trên PROJECT ROLE
    // Chỉ Member mới bị giới hạn chỉnh sửa
    if (projectRole === 'Member') {
      // Member chỉ được update task của mình
      if (String(task.assigneeId) !== String(userId)) {
        throw new Error('UNAUTHORIZED_ACCESS');
      }
      // Member chỉ được đổi status, không được đổi field khác
      const allowedKeys = ["status"];
      const invalidKeys = Object.keys(updateData).filter((key) => !allowedKeys.includes(key));
      if (invalidKeys.length > 0) {
        console.error('[updateTask] Member tried to update forbidden fields:', invalidKeys);
        throw new Error('FORBIDDEN_FIELD_UPDATE');
      }
    }
    // Manager và Admin có thể update mọi task trong project
  } else {
    projectRole = 'Admin'; // System Admin = Project Admin
    console.log('[updateTask] System Admin, full access granted');
  }

  // Handle labels
  if (updateData.labels && Array.isArray(updateData.labels)) {
    const labelIds = [];
    
    for (const labelName of updateData.labels) {
        let label = await Label.findOne({ 
            name: labelName, 
            projectId: task.projectId 
        });

        if (!label) {
          const orgId = task.organizationId || currentUser.currentOrganizationId || currentUser.organizationId;
          
          if (!orgId) {
              throw new Error("Cannot create label: Missing Organization ID");
          }

          label = await Label.create({ 
              name: labelName, 
              projectId: task.projectId,
              organizationId: orgId, 
              color: "#" + Math.floor(Math.random()*16777215).toString(16) 
          });
      }
        labelIds.push(label._id);
    }
    updateData.labels = labelIds;
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });

  try {
    await ActivityLog.create({
      projectId: task.projectId,
      userId: userId,
      taskId: task._id,
      action: "UPDATE_TASK",
      content: `updated details for task "${updatedTask.title}"`
    });
  } catch (e) { console.error(e); }

  return updatedTask;
};

export const updateTaskStatus = async (taskId, status, currentUser) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error('TASK_NOT_FOUND');

  // Check membership
  const projectId = task.projectId?._id || task.projectId;
  const userId = currentUser._id || currentUser.id;
  const userRole = currentUser.role;

  // System Admin bypass
  if (userRole !== 'Admin') {
    const membership = await ProjectMember.findOne({
      projectId: projectId,
      userId: userId
    });

    if (!membership) {
      console.error('[updateTaskStatus] No membership found');
      throw new Error('FORBIDDEN');
    }

    if (membership.status && membership.status !== 'ACTIVE') {
      console.error(' [updateTaskStatus] Membership not active');
      throw new Error('FORBIDDEN');
    }

    // Member chỉ được update status của task mình
    if (currentUser.role === "Member" && String(task.assigneeId) !== String(userId)) {
      throw new Error('UNAUTHORIZED_ACCESS');
    }
  }

  const oldStatus = task.status;
  task.status = status || task.status;
  await task.save();

  try {
    await ActivityLog.create({
      projectId: task.projectId,
      userId: userId,
      taskId: task._id,
      action: "UPDATE_STATUS",
      content: `updated status from ${oldStatus} to ${status}`
    });
  } catch (logError) {
    console.error("Logging failed:", logError.message);
  }

  return task;
};

export const reorderTask = async (taskId, newStatus, newPosition, currentUser) => {
  if (!taskId || newPosition === undefined) {
    throw new Error('MISSING_REQUIRED_FIELDS');
  }

  const task = await Task.findById(taskId);
  if (!task) throw new Error('TASK_NOT_FOUND');  

  // Chỉ assignee của task mới được reorder
  // Kể cả Admin/Manager cũng không được kéo task người khác
  const currentUserId = String(currentUser._id || currentUser.id);
  const assigneeId = task.assigneeId ? String(task.assigneeId) : null;

  console.log('[reorderTask] Permission check:', {
    currentUserId,
    assigneeId,
    isMatch: assigneeId === currentUserId
  });

  if (assigneeId !== currentUserId) {
    throw new Error('UNAUTHORIZED_ACCESS');
  }

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    {
      $set: {
        status: newStatus,
        orderIndex: newPosition
      }
    },
    { new: true }
  );

  if (!updatedTask) throw new Error('TASK_NOT_FOUND');
  return updatedTask;
};

export const deleteTask = async (taskId, currentUser) => {
  if (!["Admin", "Manager"].includes(currentUser.role)) {
    throw new Error('PERMISSION_DENIED');
  }

  const deletedTask = await Task.findByIdAndUpdate(
    taskId,
    { deletedAt: new Date() },
    { new: true }
  );

  if (!deletedTask) throw new Error('TASK_NOT_FOUND');

  try {
    await ActivityLog.create({
      projectId: deletedTask.projectId,
      userId: currentUser._id,
      taskId: deletedTask._id,
      action: "DELETE_TASK",
      content: `deleted task "${deletedTask.title}"`
    });
  } catch (e) { console.error(e); }

  return deletedTask;
};

export const createSubtask = async (taskId, title) => {
  if (!title) throw new Error('TITLE_REQUIRED');
  
  const task = await Task.findById(taskId);
  if (!task) throw new Error('TASK_NOT_FOUND');

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $push: { subtasks: { title, isCompleted: false } } },
    { new: true }
  );
  return updatedTask.subtasks[updatedTask.subtasks.length - 1];
};

export const toggleSubtask = async (taskId, subtaskId, isCompleted) => {
  const updatedTask = await Task.findOneAndUpdate(
    { "_id": taskId, "subtasks._id": subtaskId },
    { $set: { "subtasks.$.isCompleted": isCompleted } },
    { new: true }
  );
  if (!updatedTask) throw new Error('TASK_OR_SUBTASK_NOT_FOUND');
  return updatedTask;
};

export const deleteSubtask = async (taskId, subtaskId) => {
  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $pull: { subtasks: { _id: subtaskId } } },
    { new: true }
  );
  if (!updatedTask) throw new Error('TASK_NOT_FOUND');
  return updatedTask;
};

export const magicSubtasks = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task || task.deletedAt) throw new Error('TASK_NOT_FOUND');

  const subtaskTitles = await AIService.generateSubtasks(task.title, task.description || "");

  if (!subtaskTitles || subtaskTitles.length === 0) {
    return []; 
  }

  const newSubtasks = subtaskTitles.map(title => ({
    _id: new mongoose.Types.ObjectId(),
    title: title,
    isCompleted: false
  }));

  await Task.findByIdAndUpdate(
    taskId,
    { $push: { subtasks: { $each: newSubtasks } } },
    { new: true }
  );

  try {
    await ActivityLog.create({
      projectId: task.projectId,
      userId: userId,
      taskId: taskId,
      action: "AI_SUGGESTION",
      content: `generated ${newSubtasks.length} subtasks using AI`
    });
  } catch (logError) { console.error("AI Log Error:", logError.message); }

  return newSubtasks;
};