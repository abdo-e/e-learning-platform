const express = require('express');
const router = express.Router();

console.log('--- Loading API Routes ---');

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const courseRoutes = require('./course.routes');
const videoRoutes = require('./video.routes');
const analyticsRoutes = require('./analytics.routes');
const paymentRoutes = require('./payment.routes');
const subscriptionRoutes = require('./subscription.routes');
const instructorRoutes = require('./instructor.routes');
const corporateRoutes = require('./corporate.routes');

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// Register routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/videos', videoRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/payments', paymentRoutes);
router.use('/subscriptions', subscriptionRoutes);
// router.use('/instructor', instructorRoutes); (Moved to index.js for better visibility)
router.use('/corporate', corporateRoutes);

module.exports = router;
