import mongoose from "mongoose";
import dotenv from "dotenv";
import Task from "../models/task.model.js";

dotenv.config();

const seedTasks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding");

    await Task.deleteMany({});

    const mockTasks = [
      {
        title: "Setup backend project",
        description: "Initialize Express, connect MongoDB, create base routes",
        priority: "HIGH",
        status: "TODO",
        dueDate: new Date("2025-11-10"),
        projectId: "690cced881cc7191f98d8d13",   
        assigneeId: "690ccec281cc7191f98d8d12",  
      },
      {
        title: "Implement Auth Module",
        description: "Create /auth/signup and /auth/login routes",
        priority: "MEDIUM",
        status: "DOING",
        dueDate: new Date("2025-11-12"),
        projectId: "690cced881cc7191f98d8d13",
        assigneeId: "690ccec281cc7191f98d8d12",
      },
      {
        title: "Design Task CRUD API",
        description: "Implement CRUD for /tasks route with JWT verify",
        priority: "LOW",
        status: "DONE",
        dueDate: new Date("2025-11-15"),
        projectId: "690cced881cc7191f98d8d13",
        assigneeId: "690ccec281cc7191f98d8d12",
      },
    ];

    await Task.insertMany(mockTasks);

    console.log("Seeded mock tasks successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error while seeding tasks:", err);
    process.exit(1);
  }
};

seedTasks();
