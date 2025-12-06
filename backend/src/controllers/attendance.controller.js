import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";
import Project from "../models/project.model.js";
/**
 * @desc    Get client IP address
 * @param   {Request} req
 * @returns {String} IP address
 */
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown"
  );
};

/**
 * @desc    Check if user already checked in today
 * @param   {ObjectId} userId
 * @returns {Object|null} Today's attendance or null
 */
const getTodayAttendance = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return await Attendance.findOne({
    userId,
    checkInTime: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });
};

/**
 * @desc    Check-in attendance
 * @route   POST /projects/:projectId/attendance/checkin
 * @access  Private
 */
export const checkIn = async (req, res) => {
  try {
    const { note } = req.body;
    const userId = req.user._id;
//IP Client
    const clientIp = getClientIp(req);

    // Check if already checked in today
    const existingAttendance = await getTodayAttendance(userId);
    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        error: "ConflictError",
        message: "You have already checked in today",
        data: existingAttendance,
      });
    }


    // Determine status based on time (example: late if after 9 AM)
    const now = new Date();
    const hour = now.getHours();
    const status = hour >= 9 ? "LATE" : "PRESENT";

    // Create attendance record
    const attendance = new Attendance({
      userId,
      checkInTime: now,
      checkInIp: clientIp,
      status,
      note: note || "",
    });

    await attendance.save();

    // Populate user info
    await attendance.populate("userId", "name email role");

    res.status(201).json({
      success: true,
      message: "Check-in successful",
      data: attendance,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};

/**
 * @desc    Get my attendance status for today
 * @route   GET /projects/:projectId/attendance/me
 * @access  Private
 */
export const getMyAttendanceToday = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get today's attendance
    const attendance = await getTodayAttendance(userId);

    if (!attendance) {
      return res.json({
        success: true,
        message: "No check-in record for today",
        data: {
          hasCheckedIn: false,
          status: "ABSENT",
        },
      });
    }

    res.json({
      success: true,
      data: {
        hasCheckedIn: true,
        checkInTime: attendance.checkInTime,
        status: attendance.status,
        note: attendance.note,
        checkInIp: attendance.checkInIp,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};

/**
 * @desc    Get attendance history for a project
 * @route   GET /projects/:projectId/attendance
 * @access  Private (Admin/Manager)
 */
export const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const currentUser = req.user;
    const userRole = currentUser.role.toUpperCase();
  
    if (!["ADMIN", "MANAGER", "SUPER ADMIN" ].includes(currentUser.role.toUpperCase())) {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "Only Admin or Manager can view project attendance",
      });
    }
    // Build query
    const query = {};
   // admin dc xem tất cả thành viên
    if (userRole === "ADMIN" || userRole === "SUPER ADMIN") {
      // --- ADMIN: Xem hết ---
      if (userId) {
        query.userId = userId;
      }
    } else {
      // --- MANAGER: Chỉ xem nhân viên thuộc Project mình quản lý ---
      const managedProjects = await Project.find({
        $or: [
            { owner: currentUser._id }, 
            { "members": { $elemMatch: { user: currentUser._id, role: { $in: ["LEAD", "MANAGER"] } } } }
        ]
      }).select("members.user");
      
// gom id trong 1 project
      const memberIds = new Set(); // Dùng Set để loại bỏ ID trùng lặp
      managedProjects.forEach(proj => {
          proj.members.forEach(m => {
              // Lấy ID user (xử lý trường hợp m.user là object hoặc string)
              const mId = m.user?._id || m.user; 
              if(mId) memberIds.add(mId.toString());
          });
      });

      
  
    const allowedUserIds = Array.from(memberIds);

      if (userId) {
        if (!allowedUserIds.includes(userId)) {
          return res.status(403).json({
            success: false,
            message: "You do not have permission to view this user's attendance!",
          });
        }
        query.userId = userId;
      } else {
        // Nếu không lọc -> Lấy tất cả nhân viên thuộc quyền quản lý
        // FIX Typo: query.use -> query.userId
        query.userId = { $in: allowedUserIds };
      }
      
      // Edge case: Manager không quản lý ai cả
      if (allowedUserIds.length === 0) {
          return res.json({ success: true, count: 0, data: [] });
      }
    }

    if (startDate || endDate) {
      query.checkInTime = {};
      if (startDate) query.checkInTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.checkInTime.$lte = end;
      }
    }

// manager mà ko có nhân viên nào sé trả về mảng 0
    if(query.userId && query.userId.$in && query.userId.$in.length === 0){
      return res.json({
        success: true,
        count: 0,
        data: []
      })
    }
    const attendances = await Attendance.find(query)
      .populate("userId", "name email role")
      .sort({ checkInTime: -1 });

    res.json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};

/**
 * @desc    Get my attendance history
 * @route   GET /attendance/me
 * @access  Private
 */
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const query = { userId };

    if (startDate || endDate) {
      query.checkInTime = {};
      if (startDate) query.checkInTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.checkInTime.$lte = end;
      }
    }

    const attendances = await Attendance.find(query)
      .sort({ checkInTime: -1 });

    res.json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};
