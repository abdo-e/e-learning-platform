const express = require("express");
const router = express.Router();

// Import route modules
const userRoutes = require("./user.routes");
const authRoutes = require("./auth.routes");
const courseRoutes = require("./course.routes");
const videoRoutes = require("./video.routes");
const analyticsRoutes = require("./analytics.routes");

// Mount routes
router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/videos", videoRoutes);
router.use("/analytics", analyticsRoutes);

// Health check route
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is running",
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
