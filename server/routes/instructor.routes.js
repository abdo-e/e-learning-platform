const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructor.controller');
const { protect } = require('../middleware/auth');
const { requireInstructor } = require('../middleware/role.middleware');

// Register as instructor (protected)
router.post('/register', protect, instructorController.registerAsInstructor);

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
router.post('/approve/:userId', protect, instructorController.approveInstructor); // TODO: Add admin middleware
router.get('/all', protect, instructorController.getAllInstructors); // TODO: Add admin middleware

module.exports = router;
