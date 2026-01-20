import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
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
    inviteCode: {
      type: String,
      unique: true, 
      sparse: true, 
      select: false, 
    },
    stripeCustomerId: {
      type: String, 
      select: false 
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
    subscriptionExpiredAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE"
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // IP whitelist cho attendance
    allowedIps: [{
      ip: { type: String, required: true },
      description: { type: String, default: "" },
      isActive: { type: Boolean, default: true },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      addedAt: { type: Date, default: Date.now }
    }],
    // Attendance settings
    attendanceSettings: {
      enableIpCheck: { type: Boolean, default: true },
      standardCheckInHour: { type: Number, default: 9 }, // 9 AM
      standardCheckOutHour: { type: Number, default: 17 }, // 5 PM
      allowLateCheckIn: { type: Boolean, default: true },
      lateThresholdMinutes: { type: Number, default: 15 }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Organization", OrganizationSchema);