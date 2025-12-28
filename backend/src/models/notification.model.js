import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    type: { 
      type: String, 
      required: true,
    },
    content: { 
      type: String, 
      required: true 
    },
    read: { 
      type: Boolean, 
      default: false 
    },
    metadata: { 
      type: mongoose.Schema.Types.Mixed, 
      default: {} 
    }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);