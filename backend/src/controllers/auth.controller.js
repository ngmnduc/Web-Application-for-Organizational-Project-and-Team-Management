import User from "../models/user.model.js";
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
    // password minimum length
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: { message: "Password must be at least 6 characters" } });
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

// GET /auth/me
export async function me(req, res, next) {
  try {
    // verifyToken middleware attaches req.user
    const user = req.user;
    if (!user) return res.status(401).json({ error: { message: "Unauthorized" } });
    return res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

// PUT /auth/:id/role  (Admin only)
export async function promoteRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    const newRole = role || "Manager";

    // validate role
    if (!Array.isArray(User.schema.path("role").enumValues) || !User.schema.path("role").enumValues.includes(newRole)) {
      // fallback: check common roles
      const allowed = ["Admin", "Manager", "Member"];
      if (!allowed.includes(newRole)) return res.status(400).json({ error: { message: "Invalid role" } });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: { message: "User not found" } });

    user.role = newRole;
    await user.save();

    return res.json({ message: "User role updated", user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}