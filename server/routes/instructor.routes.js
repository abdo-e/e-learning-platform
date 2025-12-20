const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructor.controller');
const { protect } = require('../middleware/auth');
const { requireInstructor } = require('../middleware/role.middleware');
const uploadDocs = require('../config/multerDocs');

router.use((req, res, next) => {
    console.log(`[INSTRUCTOR ROUTER] ${req.method} ${req.url}`);
    next();
});

router.get('/ping', (req, res) => res.json({ message: 'Instructor routes are reachable' }));

// Register as instructor (protected)
router.post('/register', protect, uploadDocs.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'recommendationLetter', maxCount: 1 }
]), instructorController.registerAsInstructor);

// Get instructor dashboard (protected, instructor only)
router.get('/dashboard', protect, requireInstructor, instructorController.getInstructorDashboard);

// Get instructor earnings (protected, instructor only)
router.get('/earnings', protect, requireInstructor, instructorController.getInstructorEarnings);

// Request payout (protected, instructor only)
router.post('/payout', protect, requireInstructor, instructorController.requestPayout);

// Update instructor profile (protected, instructor only)
router.put('/profile', protect, requireInstructor, instructorController.updateInstructorProfile);

// Get instructor profile by ID (public)
router.get('/:instructorId', instructorController.getInstructorProfile);

// Admin routes (protected)
router.post('/approve/:userId', protect, instructorController.approveInstructor); // TODO: Add admin check middleware if available
router.post('/reject/:userId', protect, instructorController.rejectInstructor);
router.get('/applications/pending', protect, instructorController.getPendingApplications);
router.get('/document/:userId/:type', protect, instructorController.downloadDocument);
router.get('/all', protect, instructorController.getAllInstructors);

module.exports = router;
