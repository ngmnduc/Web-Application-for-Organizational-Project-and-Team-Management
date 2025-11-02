import { verifyJwt } from "../utils/jwt.js";
import User from "../models/user.model.js";

// verify token and attach user to req.user
export async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: { message: "Missing or invalid Authorization header" } });
    }
    const decoded = verifyJwt(token);
    req.auth = decoded;
    req.userId = decoded.sub;
    req.userRole = decoded.role;

    // load user from DB and ensure still exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: { message: "User not found or removed" } });
    }
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ error: { message: "Invalid or expired token" } });
  }
}

// checkRole("Admin") hoặc checkRole("Admin","Manager")
export function checkRole(...allowed) {
  return (req, res, next) => {
    const role = req.userRole || (req.user && req.user.role);
    if (!role) return res.status(401).json({ error: { message: "Unauthorized" } });
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: { message: "Forbidden: insufficient role" } });
    }
    next();
  };
}