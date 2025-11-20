import Comment from "../models/comment.model.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

/**
 * @desc Create a new comment (auto-create notification if there’s a mention)
 * @route POST /comments
 */
export const createComment = async (req, res) => {
  try {
    const { taskId, content } = req.body;
    const userId = req.user._id;

    if (!taskId || !content)
      return res.status(400).json({ success: false, message: "taskId and content are required" });

    const comment = await Comment.create({ taskId, userId, content });

    // detect mentions in the format @username
    const mentions = [...content.matchAll(/@([A-Za-zÀ-ỹ0-9_]+)/g)].map((m) => m[1]);
    if (mentions.length) {
      for (const name of mentions) {
        const mentionedUser = await User.findOne({ name });
        if (mentionedUser) {
          await Notification.create({
            userId: mentionedUser._id,
            message: `@${req.user.name} mentioned you in a comment.`,
          });
        }
      }
    }

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
 * @desc Get all comments for a task
 * @route GET /comments/:taskId
 */
export const getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ taskId })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
