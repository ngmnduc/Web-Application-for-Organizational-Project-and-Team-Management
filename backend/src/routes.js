import { Router } from "express";
import { signup, login, me, promoteRole } from "./controllers/auth.controller.js";
import { verifyToken, checkRole } from "./middlewares/auth.js";
import { ROLES } from "./models/user.model.js";

const router = Router();

router.get("/healthz", (req, res) => res.json({ ok: true }));

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.get("/auth/me", verifyToken, me);
// Admin-only: promote a user to a role (default: Manager)
router.put("/auth/:id/role", verifyToken, checkRole(ROLES.ADMIN), promoteRole);

router.get("/protected/me", verifyToken, (req, res) => {
  res.json({ message: "Authenticated", user: req.user });
});

router.get("/protected/admin",
  verifyToken,
  checkRole(ROLES.ADMIN),
  (req, res) => res.json({ message: "Admin only content" })
);

router.get("/protected/manager",
  verifyToken,
  checkRole(ROLES.ADMIN, ROLES.MANAGER),
  (req, res) => res.json({ message: "Manager or Admin content" })
);

export default router;
