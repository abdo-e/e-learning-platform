const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');

/**
 * Middleware to check if user has an active subscription
 */
exports.requireActiveSubscription = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ userId });

        if (!subscription || !subscription.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Active subscription required to access this content',
                requiresSubscription: true
            });
        }

        // Attach subscription to request for use in controllers
        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking subscription status',
            error: error.message
        });
    }
};

/**
 * Middleware to check if user has access to premium content
 */
exports.requirePremiumAccess = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ userId });

        if (!subscription || !subscription.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Premium subscription required to access this content',
                requiresSubscription: true
            });
        }

        if (!subscription.features.premiumVideos) {
            return res.status(403).json({
                success: false,
                message: 'Your subscription plan does not include premium content'
            });
        }

        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('Premium access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking premium access',
            error: error.message
        });
    }
};

/**
 * Middleware to check if user can access a specific course
 * Checks if course is:
 * - Free (anyone can access)
 * - Paid (user must have purchased it)
 * - Premium (user must have active subscription)
 */
exports.checkCourseAccess = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const courseId = req.params.courseId || req.params.id;

        const Course = require('../models/course.model');
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Free courses are accessible to everyone
        if (course.courseType === 'free') {
            req.course = course;
            return next();
        }

        // Premium courses require active subscription
        if (course.courseType === 'premium') {
            const subscription = await Subscription.findOne({ userId });

            if (!subscription || !subscription.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Active subscription required to access this premium course',
                    requiresSubscription: true
                });
            }

            req.course = course;
            req.subscription = subscription;
            return next();
        }

        // Paid courses require purchase or subscription
        if (course.courseType === 'paid') {
            const user = await User.findById(userId);

            // Check if user purchased the course
            const hasPurchased = user.purchasedCourses.some(
                pc => pc.courseId.toString() === courseId
            );

            if (hasPurchased) {
                req.course = course;
                return next();
            }

            // Check if user has active subscription (subscription gives access to all courses)
            const subscription = await Subscription.findOne({ userId });

            if (subscription && subscription.isActive && subscription.features.unlimitedCourses) {
                req.course = course;
                req.subscription = subscription;
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'You must purchase this course or have an active subscription to access it',
                requiresPurchase: true,
                coursePrice: course.price,
                courseCurrency: course.currency
            });
        }

        // Default: deny access
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    } catch (error) {
        console.error('Course access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking course access',
            error: error.message
        });
    }
};

/**
 * Middleware to check subscription feature access
 */
exports.checkFeatureAccess = (featureName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user._id;

            const subscription = await Subscription.findOne({ userId });

            if (!subscription || !subscription.isActive) {
                return res.status(403).json({
                    success: false,
                    message: `Active subscription required for ${featureName}`,
                    requiresSubscription: true
                });
            }

            if (!subscription.hasFeature(featureName)) {
                return res.status(403).json({
                    success: false,
                    message: `Your subscription plan does not include ${featureName}`
                });
            }

            req.subscription = subscription;
            next();
        } catch (error) {
            console.error('Feature access check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking feature access',
                error: error.message
            });
        }
    };
};
