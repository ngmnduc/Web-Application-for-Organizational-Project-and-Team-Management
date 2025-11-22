import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import Task from "../models/task.model.js";

/**
 * @desc    Create a new comment & trigger mentions
 * @route   POST /tasks/:taskId/comments
 * @access  Private
 */
export const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const currentUser = req.user;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: "Content is required" 
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: "Task not found" 
      });
    }

    const comment = new Comment({
      taskId,
      userId: currentUser._id,
      content,
    });

    await comment.save();

    const mentions = [...content.matchAll(/@([A-Za-zÀ-ỹ0-9_]+)/g)].map((m) => m[1]);

    if (mentions.length > 0) {
      const uniqueNames = [...new Set(mentions)];

      for (const name of uniqueNames) {
        const mentionedUser = await User.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, "i") } 
        });

        if (mentionedUser && String(mentionedUser._id) !== String(currentUser._id)) {
          await Notification.create({
            userId: mentionedUser._id,
            type: "MENTION",
            payload: `${currentUser.name} mentioned you in task "${task.title}"`,
            read: false
          });
        }
      }
    }

    await comment.populate("userId", "name email role");

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all comments for a specific task
 * @route   GET /tasks/:taskId/comments
 * @access  Private
 */
export const getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ taskId })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};