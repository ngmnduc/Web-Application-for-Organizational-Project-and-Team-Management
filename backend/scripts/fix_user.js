import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/user.model.js";
import Organization from "../src/models/organization.model.js";

// Config dotenv để nhận file .env ở thư mục backend
dotenv.config(); 

const fixUsers = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error(" Missing MONGO_URI in .env");

    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB...");

    // 1. Lấy Organization Mặc định
    const defaultOrg = await Organization.findOne();
    if (!defaultOrg) {
        throw new Error("Không tìm thấy Organization nào. Hãy chạy seed-org.js trước!");
    }
    console.log(`Default Org found: ${defaultOrg.name}`);

    // 2. Tìm tất cả user CHƯA CÓ organizationId
    // (Bao gồm cả trường hợp field này không tồn tại hoặc bằng null)
    const filter = { 
        $or: [
            { currentOrganizationId: { $exists: false } },
            { currentOrganizationId: null }
        ]
    };

    const count = await User.countDocuments(filter);
    console.log(`Examples of orphan users found: ${count}`);

    if (count === 0) {
        console.log("Good news: All users already have an Organization!");
        process.exit(0);
    }

    // 3. Update hàng loạt
    const result = await User.updateMany(filter, { 
        $set: { currentOrganizationId: defaultOrg._id },
        $addToSet: { organizations: defaultOrg._id } // Thêm vào mảng nếu chưa có
    });

    console.log(`FIX COMPLETE: Updated ${result.modifiedCount} users.`);
    console.log(`Now Manager/Member can login and see data of "${defaultOrg.name}".`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

fixUsers();