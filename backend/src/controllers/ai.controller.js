import Task from "../models/task.model.js";
import Meeting from "../models/meeting.model.js";
import AIService from "../services/ai.service.js";
import mongoose from "mongoose";

/**
 * @desc    Get AI-generated daily summary based on user's tasks and meetings
 * @route   GET /ai/daily-brief
 * @access  Private
 */
export const getDailyBrief = async (req, res) => {
  try {
    const userId = req.user._id;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
        assigneeId: userId,
        status: { $nin: ["DONE", "BACKLOG"] }, 
        $or: [
            { dueDate: { $gte: startOfDay, $lte: endOfDay } }, 
            { dueDate: { $lt: startOfDay } } 
        ],
        deletedAt: null
    }).select("title status priority dueDate labels");

    const meetings = await Meeting.find({
        attendees: userId, 
        startTime: { $gte: startOfDay, $lte: endOfDay },
        deletedAt: null
    }).select("title startTime endTime location");

    if (tasks.length === 0 && meetings.length === 0) {
        return res.status(200).json({
            success: true,
            data: {
                greeting: "Hello! You have a completely free schedule today.",
                task_highlights: [],
                upcoming_meetings: [],
                encouragement: "Enjoy your free time!"
            }
        });
    }

    const simplifiedTasks = tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        labels: t.labels
    }));

    const simplifiedMeetings = meetings.map(m => ({
        title: m.title,
        time: new Date(m.startTime).toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        }),
        location: m.location || "Online"
    }));

    const brief = await AIService.summarizeDay(simplifiedTasks, simplifiedMeetings);

    res.status(200).json({
        success: true,
        data: brief 
    });

  } catch (error) {
    console.error("AI Daily Brief Controller Error:", error.message);
    res.status(500).json({ success: false, message: "Could not generate daily brief." });
  }
};