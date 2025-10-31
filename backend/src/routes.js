import { Router } from "express";

const router = Router();

// ví dụ
router.get("/healthz", (req, res) => res.json({ ok: true }));

// Auth
router.use("/auth", authRoutes);

// Protected sample routes (test phân quyền)
router.get("/protected/me", verifyToken, (req, res) => {
  res.json({ message: "Authenticated", userId: req.userId, role: req.userRole });
});
router.get("/protected/admin", verifyToken, checkRole("Admin"), (req, res) => {
  res.json({ message: "Admin only content" });
});
router.get("/protected/manager", verifyToken, checkRole("Admin", "Manager"), (req, res) => {
  res.json({ message: "Manager or Admin content" });
});

// mount các module khác:
// router.use("/v1/auth", authRoutes);
// router.use("/v1/projects", projectRoutes);
// ...

export default router;  
