const User = require('../models/user.model');
const Course = require('../models/course.model');
const Payment = require('../models/payment.model');
const { sendInstructorStatusEmail } = require('../utils/mail.utils');

/**
 * Register as instructor or apply for instructor status
 */
exports.registerAsInstructor = async (req, res) => {
    console.log('[CONTROLLER DEBUG] Entered registerAsInstructor');
    try {
        const { bio, expertise } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'instructor') {
            return res.status(400).json({
                success: false,
                message: 'You are already an instructor'
            });
        }

        if (user.instructorProfile && user.instructorProfile.applicationStatus === 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Your application is already pending review'
            });
        }

        // Get file paths
        const cvPath = req.files && req.files['cv'] ? req.files['cv'][0].path : null;
        const letterPath = req.files && req.files['recommendationLetter'] ? req.files['recommendationLetter'][0].path : null;

        if (!cvPath) {
            return res.status(400).json({
                success: false,
                message: 'CV is required for instructor application'
            });
        }

        // Initialize or update instructor profile
        user.instructorProfile = {
            ...user.instructorProfile,
            isApproved: false,
            applicationStatus: 'pending',
            bio: bio || '',
            expertise: expertise ? (Array.isArray(expertise) ? expertise : expertise.split(',').map(e => e.trim())) : [],
            cv: cvPath,
            recommendationLetter: letterPath,
            appliedAt: new Date()
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Instructor application submitted successfully. Awaiting admin approval.',
            data: {
                applicationStatus: user.instructorProfile.applicationStatus,
                appliedAt: user.instructorProfile.appliedAt
            }
        });
    } catch (error) {
        console.error('Register as instructor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting instructor application',
            error: error.message
        });
    }
};

/**
 * Approve instructor application (Admin only)
 */
exports.approveInstructor = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.instructorProfile) {
            return res.status(400).json({
                success: false,
                message: 'User has not applied to be an instructor'
            });
        }

        user.role = 'instructor';
        user.instructorProfile.isApproved = true;
        user.instructorProfile.applicationStatus = 'approved';
        user.instructorProfile.approvedAt = new Date();

        await user.save();

        // Send email notification
        await sendInstructorStatusEmail(user, 'approved');

        res.status(200).json({
            success: true,
            message: 'Instructor approved successfully and notification email sent',
            data: {
                userId: user._id,
                role: user.role,
                status: user.instructorProfile.applicationStatus
            }
        });
    } catch (error) {
        console.error('Approve instructor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving instructor',
            error: error.message
        });
    }
};

/**
 * Get instructor dashboard data
 */
exports.getInstructorDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user || user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Instructor role required.'
            });
        }

        // Get instructor's courses
        const courses = await Course.find({ instructor: userId })
            .select('title totalEnrollments totalRevenue averageRating createdAt');

        // Get recent payments
        const recentPayments = await Payment.find({
            paymentType: 'course_purchase',
            courseId: { $in: courses.map(c => c._id) }
        })
            .populate('userId', 'name email')
            .populate('courseId', 'title')
            .sort({ createdAt: -1 })
            .limit(10);

        // Calculate statistics
        const stats = {
            totalCourses: courses.length,
            totalStudents: user.instructorProfile.totalStudents,
            totalEarnings: user.instructorProfile.totalEarnings,
            availableBalance: user.instructorProfile.availableBalance,
            averageRating: user.instructorProfile.rating,
            totalRatings: user.instructorProfile.totalRatings
        };

        res.status(200).json({
            success: true,
            data: {
                profile: user.instructorProfile,
                courses,
                recentPayments,
                stats
            }
        });
    } catch (error) {
        console.error('Get instructor dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching instructor dashboard',
            error: error.message
        });
    }
};

/**
 * Get instructor earnings
 */
exports.getInstructorEarnings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate } = req.query;

        const user = await User.findById(userId);

        if (!user || user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Instructor role required.'
            });
        }

        // Get instructor's courses
        const courses = await Course.find({ instructor: userId });
        const courseIds = courses.map(c => c._id);

        // Build query for payments
        const query = {
            paymentType: 'course_purchase',
            courseId: { $in: courseIds },
            status: 'completed'
        };

        if (startDate || endDate) {
            query.completedAt = {};
            if (startDate) query.completedAt.$gte = new Date(startDate);
            if (endDate) query.completedAt.$lte = new Date(endDate);
        }

        // Get payments
        const payments = await Payment.find(query)
            .populate('courseId', 'title')
            .sort({ completedAt: -1 });

        // Calculate earnings (70% of each payment)
        const earnings = payments.map(p => ({
            ...p.toObject(),
            instructorShare: p.amount * 0.7
        }));

        const totalEarnings = earnings.reduce((sum, e) => sum + e.instructorShare, 0);

        res.status(200).json({
            success: true,
            data: {
                earnings,
                summary: {
                    totalEarnings,
                    totalTransactions: earnings.length,
                    availableBalance: user.instructorProfile.availableBalance
                }
            }
        });
    } catch (error) {
        console.error('Get instructor earnings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching instructor earnings',
            error: error.message
        });
    }
};

/**
 * Request payout
 */
exports.requestPayout = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user || user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Instructor role required.'
            });
        }

        if (!user.instructorProfile.payoutDetails || !user.instructorProfile.payoutDetails.accountType) {
            return res.status(400).json({
                success: false,
                message: 'Please set up your payout details first'
            });
        }

        if (amount > user.instructorProfile.availableBalance) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Create payout payment record
        const payment = new Payment({
            userId,
            amount,
            currency: 'USD',
            status: 'pending',
            paymentType: 'instructor_payout',
            metadata: {
                accountType: user.instructorProfile.payoutDetails.accountType
            }
        });

        await payment.save();

        // Deduct from available balance
        user.instructorProfile.availableBalance -= amount;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Payout request submitted successfully',
            data: {
                payment,
                remainingBalance: user.instructorProfile.availableBalance
            }
        });
    } catch (error) {
        console.error('Request payout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error requesting payout',
            error: error.message
        });
    }
};

/**
 * Update instructor profile
 */
exports.updateInstructorProfile = async (req, res) => {
    try {
        const { bio, expertise, payoutDetails } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user || user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Instructor role required.'
            });
        }

        if (bio) user.instructorProfile.bio = bio;
        if (expertise) user.instructorProfile.expertise = expertise;
        if (payoutDetails) user.instructorProfile.payoutDetails = payoutDetails;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Instructor profile updated successfully',
            data: user.instructorProfile
        });
    } catch (error) {
        console.error('Update instructor profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating instructor profile',
            error: error.message
        });
    }
};

/**
 * Get instructor profile by ID (public)
 */
exports.getInstructorProfile = async (req, res) => {
    try {
        const { instructorId } = req.params;

        const instructor = await User.findById(instructorId)
            .select('name email instructorProfile');

        if (!instructor || instructor.role !== 'instructor') {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        // Get instructor's courses
        const courses = await Course.find({ instructor: instructorId })
            .select('title description category difficulty price averageRating totalEnrollments');

        res.status(200).json({
            success: true,
            data: {
                instructor: {
                    id: instructor._id,
                    name: instructor.name,
                    bio: instructor.instructorProfile.bio,
                    expertise: instructor.instructorProfile.expertise,
                    rating: instructor.instructorProfile.rating,
                    totalRatings: instructor.instructorProfile.totalRatings,
                    totalStudents: instructor.instructorProfile.totalStudents,
                    totalCourses: instructor.instructorProfile.totalCourses
                },
                courses
            }
        });
    } catch (error) {
        console.error('Get instructor profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching instructor profile',
            error: error.message
        });
    }
};

/**
 * Get all instructors (Admin only)
 */
exports.getAllInstructors = async (req, res) => {
    try {
        const { page = 1, limit = 20, approved } = req.query;

        const query = { role: 'instructor' };
        if (approved !== undefined) {
            query['instructorProfile.isApproved'] = approved === 'true';
        }

        const instructors = await User.find(query)
            .select('name email instructorProfile createdAt')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: instructors,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all instructors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching instructors',
            error: error.message
        });
    }
};
/**
 * Reject instructor application (Admin only)
 */
exports.rejectInstructor = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.instructorProfile || user.instructorProfile.applicationStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'User does not have a pending application'
            });
        }

        user.instructorProfile.applicationStatus = 'rejected';
        user.instructorProfile.isApproved = false;

        await user.save();

        // Send email notification
        await sendInstructorStatusEmail(user, 'rejected');

        res.status(200).json({
            success: true,
            message: 'Instructor application rejected and notification email sent'
        });
    } catch (error) {
        console.error('Reject instructor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting instructor',
            error: error.message
        });
    }
};

/**
 * Get all pending instructor applications (Admin only)
 */
exports.getPendingApplications = async (req, res) => {
    try {
        const applications = await User.find({
            'instructorProfile.applicationStatus': 'pending'
        }).select('name email instructorProfile createdAt');

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        console.error('Get pending applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending applications',
            error: error.message
        });
    }
};

/**
 * Download instructor document (Admin only)
 */
exports.downloadDocument = async (req, res) => {
    try {
        const { userId, type } = req.params; // type: 'cv' or 'recommendationLetter'
        const user = await User.findById(userId);

        if (!user || !user.instructorProfile) {
            return res.status(404).json({ message: 'User or documents not found' });
        }

        const filePath = user.instructorProfile[type];
        if (!filePath) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.download(filePath);
    } catch (error) {
        res.status(500).json({ message: 'Error downloading document', error: error.message });
    }
};
