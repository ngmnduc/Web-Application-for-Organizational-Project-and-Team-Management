import Notification from "../models/notification.model.js";

export const createNotification = async ({ userId, type, content, relatedId, link }) => {
  try {
    if (!userId || !type || !content) {
      console.warn("[NotificationService] Missing info:", { userId, type });
      return;
    }
    
    const notificationData = {
      userId,
      type,
      payload: content, 
      read: false
    };

    if (relatedId && (type === 'TASK_ASSIGN' || type === 'TASK_UPDATE')) {
        notificationData.taskId = relatedId;
    }

    await Notification.create(notificationData);

  } catch (error) {
    console.error("[NotificationService] Error creating notification:", error.message);
  }
};

export const markAllAsRead = async (userId) => {
    try {
        await Notification.updateMany(
            { userId: userId, read: false },
            { $set: { read: true } }
        );
        return true;
    } catch (error) {
        throw error;
    }
};