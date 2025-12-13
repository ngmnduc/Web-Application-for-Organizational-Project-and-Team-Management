import mongoose from "mongoose"

const projectMemberSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true, 
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: true, 
            index: true,
        },
        roleInProject:{
            type: String,
            enum: ["Admin", "Manager", "Member"], 
            default: "Member"
        },
        status: {
            type: String,
            enum: ["ACTIVE", "PENDING", "REJECTED"], 
            default: "PENDING"
        }
    }, 
    { timestamps: true }
); 

projectMemberSchema.index(
    { projectId: 1, userId: 1 }, 
    { unique: true }
);

const ProjectMember = mongoose.model("ProjectMember", projectMemberSchema);
export default ProjectMember;