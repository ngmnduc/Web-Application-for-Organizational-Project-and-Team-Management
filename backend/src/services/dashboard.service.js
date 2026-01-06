import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import Task from "../models/task.model.js";

class DashboardService {
  _getDateRange(month, year) {
    if (!month || !year) return null;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }

  getDayName(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  async getAdminStats(currentOrganizationId, projectId = null, month = null, year = null) {
    if (!currentOrganizationId) throw new Error("ORGANIZATION_REQUIRED");
    
    const orgIdObj = new mongoose.Types.ObjectId(currentOrganizationId);
    const dateRange = this._getDateRange(month, year);

    // 1. Project & Member: Always All-time (per Lead's requirement)
    const projectBaseFilter = { organizationId: currentOrganizationId, deletedAt: null };
    const memberBaseFilter = { organizationId: currentOrganizationId, status: "ACTIVE" };

    if (projectId && projectId !== 'all') {
      projectBaseFilter._id = new mongoose.Types.ObjectId(projectId);
      memberBaseFilter.projectId = new mongoose.Types.ObjectId(projectId);
    }

    // 2. Task Match Stage: Only Task and Activities filter by month/year
    const taskMatchStage = { 
      "project.organizationId": orgIdObj, 
      "project.deletedAt": null, 
      deletedAt: null 
    };
    if (projectId && projectId !== 'all') {
      taskMatchStage["project._id"] = new mongoose.Types.ObjectId(projectId);
    }
    if (dateRange) {
      taskMatchStage.createdAt = dateRange; // Apply month/year filter here
    }

    const [
      totalProjects, 
      activeProjects,
      archivedProjects,
      completedProjects,
      totalMembers,
      allTasksCount,
      doneTasksCount,
      tasksByPriority
    ] = await Promise.all([
      Project.countDocuments(projectBaseFilter), // All-time 
      Project.countDocuments({ ...projectBaseFilter, status: "active" }),
      Project.countDocuments({ ...projectBaseFilter, status: "archived" }),
      Project.countDocuments({ ...projectBaseFilter, status: "completed" }),
      ProjectMember.distinct("userId", memberBaseFilter).then(res => res.length),

      // Task Aggregation with Date Filter
      Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: taskMatchStage },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),

      Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: { ...taskMatchStage, status: "DONE" } },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),

      Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: taskMatchStage },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ])
    ]);

    const avgProgress = allTasksCount > 0 ? Math.round((doneTasksCount / allTasksCount) * 100) : 0;

    // Upcoming Deadlines: All-time active projects
    const upcomingDeadlines = await Project.find({ ...projectBaseFilter, status: "active", deadline: { $gte: new Date() } })
      .select("name deadline status").sort({ deadline: 1 }).limit(5);

    // Map Priority
    const priorityMap = { "HIGH": 0, "MEDIUM": 0, "LOW": 0, "CRITICAL": 0 };
    tasksByPriority.forEach(item => {
      const key = item._id ? item._id.toUpperCase() : "MEDIUM";
      if (priorityMap.hasOwnProperty(key)) priorityMap[key] = item.count;
    });

    return {
      success: true,
      kpi: { totalProjects, totalMembers, completedProjects, avgProgress },
      charts: {
        projectStatus: [
          { name: "Active", value: activeProjects },
          { name: "Archived", value: archivedProjects },
          { name: "Completed", value: completedProjects }
        ],
        priorityDistribution: Object.keys(priorityMap).map(k => ({ name: k, value: priorityMap[k] })),
        progress: { total: allTasksCount, done: doneTasksCount, percent: avgProgress }
      },
      lists: { upcomingDeadlines }
    };
  }

  async getManagerStats(userId, currentOrganizationId, projectId = null, month = null, year = null) {
    if (!currentOrganizationId) throw new Error("ORGANIZATION_REQUIRED");

    // 1. Get managed projects
    const managedProjects = await ProjectMember.find({
      userId: userId, organizationId: currentOrganizationId,
      status: "ACTIVE", roleInProject: { $in: ["Manager", "Admin"] } 
    }).select("projectId");

    if (!managedProjects.length) return this._emptyStats();

    let projectIds = managedProjects.map(m => m.projectId);
    const totalManagedProjects = projectIds.length;

    if (projectId && projectId !== 'all') {
      projectIds = projectIds.filter(id => id.toString() === projectId.toString());
      if (!projectIds.length) return this._emptyStats();
    }

    // 2. Task filters (Apply Month/Year)
    const dateRange = this._getDateRange(month, year);
    const baseMatch = { projectId: { $in: projectIds }, deletedAt: null };
    if (dateRange) baseMatch.createdAt = dateRange;

    const now = new Date();
    const [totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks, priorityStatsRaw, teamSize] = await Promise.all([
      Task.countDocuments(baseMatch),
      Task.countDocuments({ ...baseMatch, status: "TODO" }),
      Task.countDocuments({ ...baseMatch, status: "DOING" }),
      Task.countDocuments({ ...baseMatch, status: "DONE" }),
      Task.countDocuments({ ...baseMatch, dueDate: { $lt: now }, status: { $ne: "DONE" } }),
      Task.aggregate([{ $match: baseMatch }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      ProjectMember.distinct("userId", { projectId: { $in: projectIds }, status: "ACTIVE" }).then(res => res.length)
    ]);

    return {
      success: true,
      kpi: {
        myProjects: totalManagedProjects,
        teamSize,
        tasksCompleted: doneTasks,
        // Full KPI object requested by Lead 
        taskSummary: { totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks }
      },
      charts: {
        progress: { total: totalTasks, done: doneTasks, percent: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 }
      }
    };
  }

  async getMemberStats(userId, projectId = null, month = null, year = null) {
    const dateRange = this._getDateRange(month, year);
    const baseMatch = { deletedAt: null };
    
    if (projectId && projectId !== 'all') {
      baseMatch.projectId = new mongoose.Types.ObjectId(projectId);
    } else {
      baseMatch.assigneeId = new mongoose.Types.ObjectId(userId);
    }
    
    if (dateRange) baseMatch.createdAt = dateRange;

    const now = new Date();
    const [totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks] = await Promise.all([
      Task.countDocuments(baseMatch),
      Task.countDocuments({ ...baseMatch, status: "TODO" }),
      Task.countDocuments({ ...baseMatch, status: "DOING" }),
      Task.countDocuments({ ...baseMatch, status: "DONE" }),
      Task.countDocuments({ ...baseMatch, dueDate: { $lt: now }, status: { $ne: "DONE" } })
    ]);

    return { success: true, kpi: { totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks } };
  }

  _emptyStats() {
    return { success: true, kpi: { totalTasks: 0, doneTasks: 0 }, charts: {} };
  }
}

export default new DashboardService();