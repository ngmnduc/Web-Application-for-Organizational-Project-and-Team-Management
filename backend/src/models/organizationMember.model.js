import mongoose from "mongoose";

const OrganizationMemberSchema = new mongoose.Schema(
    {
        organizationId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Organization", 
            required: true 
        },
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },
        roleInOrganization: { 
            type: String, 
            enum: ["ORG_ADMIN", "ORG_MEMBER"], 
            default: "ORG_MEMBER",
            required: true
        },
    },
    { 
        timestamps: true,
        indexes: [
            { fields: ['organizationId', 'userId'], unique: true }
        ]
    }
);

export default mongoose.model("OrganizationMember", OrganizationMemberSchema);