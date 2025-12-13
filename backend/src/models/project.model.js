import mongoose from "mongoose";

const labelSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        color: { type: String, default: "#3b82f6" },
    },
    { timestamps: true }
);

const projectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["active", "archived"], default: "active" },
        labels: { type: [labelSchema], default: [] }, 
        organizationId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Organization", 
            required: true 
        },
        inviteCode: {
            type: String,
            unique: true,
            sparse: true, 
            select: false, 
        },

        meta: { type: Object, default: {} },
        deletedAt: { type: Date, default: null },
        deadline: { type: Date },
    },
    { timestamps: true }
);

projectSchema.index({ organizationId: 1, deletedAt: 1 });

export default mongoose.model("Project", projectSchema);