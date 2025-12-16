import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import Task from "../models/task.model.js";

class DashboardService {

  getDayName(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  async getAdminStats(currentOrganizationId) {
    if (!currentOrganizationId) throw new Error("ORGANIZATION_REQUIRED");
    const [
      totalProjects, 
      activeProjects,
      archivedProjects,
      totalMembers,
      completedProjects, 
      allTasksCount,
      doneTasksCount
    ] = await Promise.all([
      Project.countDocuments({ organizationId: currentOrganizationId, deletedAt: null }),
      Project.countDocuments({ organizationId: currentOrganizationId, status: "active", deletedAt: null }),
      Project.countDocuments({ organizationId: currentOrganizationId, status: "archived", deletedAt: null }),
      ProjectMember.distinct("userId", { organizationId: currentOrganizationId, status: "ACTIVE" }).then(res => res.length),
      Project.countDocuments({ organizationId: currentOrganizationId, status: "completed", deletedAt: null }),

      Task.aggregate([
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "project"
          }
        },
        { $unwind: "$project" },
        { $match: { "project.organizationId": new mongoose.Types.ObjectId(currentOrganizationId), "project.deletedAt": null, deletedAt: null } },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),

      Task.aggregate([
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "project"
          }
        },
        { $unwind: "$project" },
        { 
          $match: { 
            "project.organizationId": new mongoose.Types.ObjectId(currentOrganizationId), 
            "project.deletedAt": null, 
            deletedAt: null,
            status: "DONE" 
          } 
        },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0)
    ]);

    const avgProgress = allTasksCount > 0 
      ? Math.round((doneTasksCount / allTasksCount) * 100) 
      : 0;

    const projectStatusDistribution = [
      { name: "Active", value: activeProjects },
      { name: "Archived", value: archivedProjects },
      { name: "Completed", value: completedProjects }
    ];

    const upcomingDeadlineProjects = await Project.find({
      organizationId: currentOrganizationId,
      status: "active",
      deletedAt: null,
      deadline: { $gte: new Date() } 
    })
    .select("name deadline status")
    .sort({ deadline: 1 })
    .limit(5);

    return {
      kpi: {
        totalProjects,
        totalMembers,
        completedProjects, 
        avgProgress
      },
      charts: {
        projectStatus: projectStatusDistribution
      },
      lists: {
        upcomingDeadlines: upcomingDeadlineProjects
      }
    };
  }

  async getMemberStats(userId) {
    if (!userId) throw new Error("USER_ID_REQUIRED");
    const now = new Date();

    const [totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks] = await Promise.all([
      Task.countDocuments({ assigneeId: userId, deletedAt: null }),
      Task.countDocuments({ assigneeId: userId, status: "TODO", deletedAt: null }),
      Task.countDocuments({ assigneeId: userId, status: "DOING", deletedAt: null }),
      Task.countDocuments({ assigneeId: userId, status: "DONE", deletedAt: null }),
      Task.countDocuments({ assigneeId: userId, deletedAt: null, dueDate: { $lt: now }, status: { $ne: "DONE" } })
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const stats = await Task.aggregate([
      {
        $match: {
          assigneeId: new mongoose.Types.ObjectId(userId),
          status: "DONE", 
          deletedAt: null,
          updatedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const activityChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0]; 

      const found = stats.find(s => s._id === dateString);
      
      activityChart.push({
        day: this.getDayName(d),
        date: dateString,
        value: found ? found.count : 0
      });
    }

    return {
      kpi: { totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks },
      charts: { last7DaysActivity: activityChart }
    };
  }

  async getManagerStats(userId, currentOrganizationId) {
    if (!currentOrganizationId) throw new Error("ORGANIZATION_REQUIRED");

    const managedMemberships = await ProjectMember.find({
      userId: userId,
      organizationId: currentOrganizationId,
      status: "ACTIVE",
      roleInProject: { $in: ["Manager", "Admin"] } 
    }).select("projectId");

    if (!managedMemberships || managedMemberships.length === 0) {
      return {
        kpi: { myProjects: 0, teamSize: 0, tasksCompleted: 0 },
        charts: { 
          priorityDistribution: [], 
          progress: { total: 0, done: 0, percent: 0 } 
        }
      };
    }

    const projectIds = managedMemberships.map(m => m.projectId);

    const [
      teamSize,
      totalTasks,
      tasksCompleted,
      tasksByPriority
    ] = await Promise.all([
      ProjectMember.distinct("userId", { projectId: { $in: projectIds }, status: "ACTIVE" }).then(res => res.length),
      Task.countDocuments({ projectId: { $in: projectIds }, deletedAt: null }),
      Task.countDocuments({ projectId: { $in: projectIds }, status: "DONE", deletedAt: null }),
      Task.aggregate([
        { $match: { projectId: { $in: projectIds }, deletedAt: null } },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ])
    ]);

    const priorityMap = { "HIGH": 0, "MEDIUM": 0, "LOW": 0, "CRITICAL": 0 };
    tasksByPriority.forEach(item => {
      const key = item._id ? item._id.toUpperCase() : "MEDIUM";
      if (priorityMap.hasOwnProperty(key)) priorityMap[key] = item.count;
    });

    const priorityChartData = Object.keys(priorityMap).map(key => ({
      name: key.charAt(0) + key.slice(1).toLowerCase(), 
      value: priorityMap[key]
    }));

    return {
      kpi: {
        myProjects: projectIds.length,
        teamSize: teamSize,
        tasksCompleted: tasksCompleted
      },
      charts: {
        priorityDistribution: priorityChartData,
        progress: {
          total: totalTasks,
          done: tasksCompleted,
          percent: totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0
        }
      }
    };
  }
}

export default new DashboardService();