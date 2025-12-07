const express = require("express");
const router = express.Router();
const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    addDoneCourse,
    updateVideoProgress,
    getVideoProgress,
    getCourseProgress,
    recordQuizAttempt,
    getAllCourseProgress,
    generateCertificate,
    getUserCertificates,
    enrollInCourse,
    getEnrolledCourses,
    unenrollFromCourse,
    getUserStats,
    addBookmark,
    removeBookmark,
    getBookmarks,
    updateStreak,
} = require("../controllers/user.controller");
const { validateDoneCourse } = require("../middleware/validation");

// User CRUD routes
router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Done courses route (legacy)
router.post("/:userId/doneCourses", validateDoneCourse, addDoneCourse);

// Progress tracking routes
router.post("/:userId/progress/video", updateVideoProgress);
router.get("/:userId/progress/video/:videoId", getVideoProgress);
router.get("/:userId/progress/course/:courseId", getCourseProgress);
router.get("/:userId/progress", getAllCourseProgress);

// Quiz attempt route
router.post("/:userId/quiz-attempt", recordQuizAttempt);

// Certificate routes
router.post("/:userId/certificate/:courseId", generateCertificate);
router.get("/:userId/certificates", getUserCertificates);

// Enrollment routes
router.post("/:userId/enroll/:courseId", enrollInCourse);
router.get("/:userId/enrolled-courses", getEnrolledCourses);
router.delete("/:userId/enroll/:courseId", unenrollFromCourse);

// Stats route
router.get("/:userId/stats", getUserStats);

// Bookmark routes
router.post("/:userId/bookmarks/:courseId", addBookmark);
router.delete("/:userId/bookmarks/:courseId", removeBookmark);
router.get("/:userId/bookmarks", getBookmarks);

// Learning streak route
router.post("/:userId/streak", updateStreak);

module.exports = router;
