import mongoose from "mongoose";

const labelSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    color: { 
      type: String, 
      default: "#3b82f6" 
    },
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true 
    },
    organizationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Organization", 
      required: true 
    },
    deletedAt: { 
      type: Date, 
      default: null 
    }
  },
  { timestamps: true }
);

// Index for efficient queries
labelSchema.index({ projectId: 1, deletedAt: 1 });
labelSchema.index({ organizationId: 1 });

export default mongoose.model("Label", labelSchema);
