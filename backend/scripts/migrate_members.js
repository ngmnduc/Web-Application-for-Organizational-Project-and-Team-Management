import mongoose from "mongoose";
import dotenv from "dotenv";
import ProjectMember from "../src/models/projectMember.model.js"; 
import Organization from "../src/models/organization.model.js"; 

dotenv.config();

const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Migration...");

    const defaultOrg = await Organization.findOne();
    if (!defaultOrg) {
        console.error("ERROR: No Organization found in the database.");
        console.error("You need to create at least one Organization via API (or manually) before running the migration.");
        process.exit(1);
    }
    console.log(`Using default Organization: ${defaultOrg.name} (${defaultOrg._id}) for legacy projects.`);

    const projectsCollection = mongoose.connection.db.collection("projects");
    const projects = await projectsCollection.find({}).toArray();
    
    console.log(`Found ${projects.length} projects to check.`);

    let migratedCount = 0;
    let updatedProjectsCount = 0;

    for (const project of projects) {
      let targetOrgId = project.organizationId;

      if (!targetOrgId) {
          targetOrgId = defaultOrg._id;
          
          await projectsCollection.updateOne(
              { _id: project._id },
              { $set: { organizationId: targetOrgId } }
          );
          updatedProjectsCount++;
          console.log(`   -> Assigned OrgID to Project "${project.name}"`);
      }

      if (project.members && Array.isArray(project.members) && project.members.length > 0) {
        
        console.log(`Migrating members for: ${project.name}...`);

        for (const memberId of project.members) {
          let userId = memberId;
          
          if (typeof memberId === 'object' && memberId._id) {
              userId = memberId._id;
          }

          const exists = await ProjectMember.findOne({
              projectId: project._id,
              userId: userId
          });

          if (!exists) {
              await ProjectMember.create({
                  organizationId: targetOrgId, 
                  projectId: project._id,
                  userId: userId,
                  roleInProject: "Member", 
                  status: "ACTIVE"
              });
              migratedCount++;
          }
        }
      }
    }

    console.log(`-----------------------------------`);
    console.log(`Migration Complete!`);
    console.log(`   - Projects updated with OrgID: ${updatedProjectsCount}`);
    console.log(`   - New ProjectMember records created: ${migratedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error);
    process.exit(1);
  }
};

migrateData();