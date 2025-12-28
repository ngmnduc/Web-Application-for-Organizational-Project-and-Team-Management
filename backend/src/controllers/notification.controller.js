import Notification from "../models/notification.model.js";
import { markAllAsRead as markAllAsReadService } from "../services/notification.service.js";

/**
 * @desc    Get notifications with PAGINATION
 * @route   GET /notifications?page=1&limit=20
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }), 
      Notification.countDocuments({ userId, read: false }) 
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PATCH /notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found or unauthorized" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark ALL notifications as read
 * @route   PATCH /notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await markAllAsReadService(userId);
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};