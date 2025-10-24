import { Router } from "express";

const router = Router();

// ví dụ
router.get("/healthz", (req, res) => res.json({ ok: true }));

// mount các module khác:
// router.use("/v1/auth", authRoutes);
// router.use("/v1/projects", projectRoutes);
// ...

export default router;  
