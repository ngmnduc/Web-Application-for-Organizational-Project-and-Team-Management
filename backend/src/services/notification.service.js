import Notification from "../models/notification.model.js";
import { sendNotification } from "./socket.service.js";

export const createNotification = async ({ userId, type, content, metadata = {} }) => {
  try {
    if (!userId || !type || !content) {
      console.warn("[NotificationService] Missing info:", { userId, type });
      return;
    }
    
    const newNoti = await Notification.create({
      userId,
      type,
      content,
      metadata,
      read: false
    });

    if (newNoti) {
        sendNotification(userId, newNoti);
    }

    return newNoti;

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