import { connectDB } from "./config/db.js";
import app from "./app.js";
import setupCronJobs from './services/cron.service.js';
import { setupSocket } from "./socket/chat.handler.js";
import {createSever} from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 4000;

await connectDB();
setupCronJobs();
const httpServer = createServer(app);

const io = new Server(httpServer,{
  cors:{
    origin: process.env.NODE_ENV === "production" ? false: 
    ["http://localhost:4000"], 
    methods: ["GET", "POST"]
  }
});

setupSocket(io); 

httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
