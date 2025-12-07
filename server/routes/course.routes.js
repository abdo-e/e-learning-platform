const express = require("express");
const router = express.Router();
const {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    addRating,
    getRatings,
    addDiscussion,
    addReply,
    getDiscussions,
} = require("../controllers/course.controller");
const { validateCourseCreation } = require("../middleware/validation");

// Course CRUD routes
router.post("/", validateCourseCreation, createCourse);
router.get("/", getCourses);
router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

// Rating routes
router.post("/:courseId/ratings", addRating);
router.get("/:courseId/ratings", getRatings);

// Discussion routes
router.post("/:courseId/discussions", addDiscussion);
router.post("/:courseId/discussions/:discussionId/replies", addReply);
router.get("/:courseId/discussions", getDiscussions);

module.exports = router;
