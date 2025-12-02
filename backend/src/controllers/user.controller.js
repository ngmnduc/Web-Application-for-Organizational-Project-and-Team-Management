import User from "../models/user.model.js";

// GET /users (admin only)
export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("name email role createdAt updatedAt");
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

// GET /users/search?q=...
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Query must be at least 2 characters" });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    })
      .select("name email role")
      .limit(20);

    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};