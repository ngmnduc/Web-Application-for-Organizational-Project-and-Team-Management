import mongoose from "mongoose";

const organizationMemberSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    roleInOrganization: {
      type: String,
      enum: ["ORG_ADMIN", "ORG_MEMBER"],
      default: "ORG_MEMBER",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index để đảm bảo user không join org 2 lần
organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export default mongoose.model("OrganizationMember", organizationMemberSchema);
