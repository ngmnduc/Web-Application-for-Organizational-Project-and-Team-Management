export const checkRole = (roles = []) => {
    return (req, res, next) => {
      const userRole = req.user?.role;
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You don't have permission for this action",
        });
      }
      next();
    };
  };
  