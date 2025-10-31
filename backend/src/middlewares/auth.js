import { verifyJwt } from "../utils/jwt.js";

export function verifyToken(req, res, next) {
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
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: "Invalid or expired token" } });
  }
}

// checkRole("Admin") hoặc checkRole("Admin","Manager")
export function checkRole(...allowed) {
  return (req, res, next) => {
    if (!req.userRole) return res.status(401).json({ error: { message: "Unauthorized" } });
    if (!allowed.includes(req.userRole)) {
      return res.status(403).json({ error: { message: "Forbidden: insufficient role" } });
    }
    next();
  };
}