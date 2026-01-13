import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["FREE", "PREMIUM"],
      default: "FREE",
    },
    subscriptionStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "CANCELLED", "PAST_DUE"], 
      default: "INACTIVE",
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    allowedIps: {
      type: [String], 
      default: [],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Organization", organizationSchema);