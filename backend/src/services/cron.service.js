import cron from 'node-cron';
import Task from '../models/task.model.js';
import { createNotification } from '../services/notification.service.js';

const setupCronJobs = () => {
  // Quét Task quá hạn (Chạy lúc 00:00 hàng ngày)
  // Cú pháp: Phút(0) Giờ(0) Ngày(*) Tháng(*) Thứ(*)
  cron.schedule('0 0 * * *', async () => {
    console.log('--- Daily Job: Starting Overdue Task Scan ---');
    
    try {
      const now = new Date();

      // Tìm các task quá hạn, chưa xong và chưa báo
      const overdueTasks = await Task.find({
        dueDate: { $lt: now },
        status: { $ne: 'DONE' },
        isOverdueNotified: false,
        deletedAt: null
      }).populate('assigneeId', 'name email');

      if (overdueTasks.length > 0) {
        console.log(`Found ${overdueTasks.length} overdue tasks. Processing...`);

        for (const task of overdueTasks) {
           //Tạo Notification + Bắn Socket
           if (task.assigneeId) {
             await createNotification({
               userId: task.assigneeId._id,
               type: 'TASK_OVERDUE',
               content: `Warning: Task "${task.title}" is overdue since ${new Date(task.dueDate).toLocaleDateString()}.`,
               metadata: {
                   taskId: task._id,
                   projectId: task.projectId 
               }
             });
           }

           //Update cờ để không báo lại nữa
           task.isOverdueNotified = true;
           await task.save();
           console.log(` -> Sent alert for task: "${task.title}"`);
        }
      } else {
        console.log('No overdue tasks found today.');
      }

    } catch (error) {
      console.error("Cron Job Error:", error);
    }
    console.log('--- Daily Scan Finished ---\n');
  }, {
    timezone: "Asia/Ho_Chi_Minh" // chạy đúng 0h00 giờ VN
  });

  // 2. Auto Checkout (Chạy lúc 23:00 hàng ngày)
  cron.schedule('0 23 * * *', async () => { 
      console.log('--- 🌙 Auto checkout running ---'); 
      // Logic auto checkout...
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });
};

export default setupCronJobs;