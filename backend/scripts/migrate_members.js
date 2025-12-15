import mongoose from "mongoose";
import dotenv from "dotenv";
import ProjectMember from "../src/models/projectMember.model.js"; 
import Organization from "../src/models/organization.model.js"; 
import User from "../src/models/user.model.js";
import Project from "../src/models/project.model.js";

dotenv.config(); 
// -----------------------

const fixAndMigrate = async () => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error(" MONGO_URI is undefined. Check your .env file!");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB. Starting Fix & Migrate...");

    // 1. Lấy Organization Mặc định (đã seed)
    const defaultOrg = await Organization.findOne();
    if (!defaultOrg) {
        throw new Error(" Không tìm thấy Organization nào. Hãy chạy seed-org.js trước!");
    }
    console.log(`Default Org: ${defaultOrg.name} (${defaultOrg._id})`);

    // ==========================================
    // BƯỚC 1: FIX USER (Cấp Org cho các user bị thiếu)
    // ==========================================
    console.log(" Fixing Users...");
    const userUpdateResult = await User.updateMany(
        { $or: [{ currentOrganizationId: null }, { currentOrganizationId: { $exists: false } }] },
        { 
            $set: { currentOrganizationId: defaultOrg._id },
            $addToSet: { organizations: defaultOrg._id }
        }
    );
    console.log(`   -> Updated ${userUpdateResult.modifiedCount} users without Org.`);

    // ==========================================
    // BƯỚC 2: RESET PROJECT MEMBER (Làm sạch để tạo lại)
    // ==========================================
    console.log("🗑  Clearing invalid ProjectMembers...");
    await ProjectMember.deleteMany({}); // Xóa hết làm lại cho sạch
    console.log("   -> ProjectMember collection cleared.");

    // ==========================================
    // BƯỚC 3: MIGRATE PROJECT & TẠO MEMBER MỚI
    // ==========================================
    const projects = await Project.find({});
    console.log(` Processing ${projects.length} projects...`);

    let memberCount = 0;

    for (const project of projects) {
        // 3.1. Đảm bảo Project có organizationId
        let targetOrgId = project.organizationId || defaultOrg._id;
        
        if (!project.organizationId) {
            project.organizationId = targetOrgId;
            await project.save();
            console.log(`   -> Fixed Org for Project: ${project.name}`);
        }

        // 3.2. Tạo Admin Member (Người tạo dự án)
        if (project.createdBy) {
            await ProjectMember.create({
                organizationId: targetOrgId,
                projectId: project._id,
                userId: project.createdBy,
                roleInProject: "Admin",
                status: "ACTIVE"
            });
            memberCount++;
        }

        // 3.3. Migrate từ mảng 'members' cũ
        const rawProject = project.toObject();
        if (rawProject.members && Array.isArray(rawProject.members)) {
            for (const m of rawProject.members) {
                const mId = m._id || m;
                const mRole = m.role || "Member";
                
                if (mId.toString() === project.createdBy.toString()) continue;

                await ProjectMember.create({
                    organizationId: targetOrgId,
                    projectId: project._id,
                    userId: mId,
                    roleInProject: mRole,
                    status: "ACTIVE"
                });
                memberCount++;
            }
        }
    }

    console.log(`-----------------------------------`);
    console.log(`TOTAL MEMBERS CREATED: ${memberCount}`);
    console.log(`DATABASE IS NOW FULLY SYNCED WITH SAAS MODEL.`);
    
    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error);
    process.exit(1);
  }
};

fixAndMigrate();