import User from "../models/user.model.js";

// GET /users (admin only)
export const listUsers = async (req, res) => {
	try {
		const users = await User.find().select("name email role createdAt updatedAt");
		res.json({ success: true, count: users.length, data: users });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};
