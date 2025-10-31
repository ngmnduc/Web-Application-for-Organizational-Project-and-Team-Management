import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

function toPublicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

// POST /auth/signup
export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: { message: "name, email, password are required" } });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: { message: "Email already registered" } });
    }

    // User đầu tiên -> Admin (hỗ trợ test phân quyền)
    const count = await User.countDocuments();
    const role = count === 0 ? "Admin" : "Member";

    const user = await User.create({ name, email, password, role });
    const token = signToken({ sub: user._id.toString(), role: user.role });

    return res.status(201).json({
      message: "Signup successful",
      token,
      tokenType: "Bearer",
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

// POST /auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: { message: "email and password are required" } });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ error: { message: "Invalid email or password" } });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: { message: "Invalid email or password" } });

    const token = signToken({ sub: user._id.toString(), role: user.role });

    return res.json({
      message: "Login successful",
      token,
      tokenType: "Bearer",
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
}