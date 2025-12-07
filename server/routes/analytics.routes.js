const express = require("express");
const router = express.Router();
const {
    getOverview,
    getUserGrowth,
    getCourseStats,
    getPopularCourses
} = require("../controllers/analytics.controller");

// Analytics routes
router.get("/overview", getOverview);
router.get("/user-growth", getUserGrowth);
router.get("/course-stats", getCourseStats);
router.get("/popular-courses", getPopularCourses);

module.exports = router;
