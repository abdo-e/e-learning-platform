const User = require("../models/user.model");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Public
 */
const createUser = async (req, res, next) => {
    try {
        // Hash password if provided
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, SALT_ROUNDS);
        }
        const user = await User.create(req.body);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ user: userResponse }); // Match old format
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Public
 */
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password'); // Exclude password
        res.status(200).json(users); // Return array directly for frontend
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // Exclude password

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({ user }); // Match old format
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Public
 */
const updateUser = async (req, res, next) => {
    try {
        // Hash password if it's being updated
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, SALT_ROUNDS);
        }

        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).select('-password'); // Exclude password from response

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({ updatedUser: user }); // Frontend expects updatedUser wrapper
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Public
 */
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({ message: "User deleted successfully" }); // Match old format
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add course to user's done courses
 * @route   POST /api/users/:userId/doneCourses
 * @access  Public
 */
const addDoneCourse = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { courseName } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { doneCourses: courseName } }, // Avoid duplicates
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Course added to done courses",
            data: {
                doneCourses: user.doneCourses,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update video progress for a user
 * @route   POST /api/users/:userId/progress/video
 * @access  Public
 */
const updateVideoProgress = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { courseId, videoId, watchedDuration, totalDuration, completed } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Find or create course progress
        let courseProgress = user.courseProgress.find(
            cp => cp.courseId.toString() === courseId
        );

        if (!courseProgress) {
            courseProgress = {
                courseId,
                videoProgress: [],
                quizAttempts: [],
                completed: false
            };
            user.courseProgress.push(courseProgress);
        }

        // Find or create video progress
        let videoProgress = courseProgress.videoProgress.find(
            vp => vp.videoId.toString() === videoId
        );

        if (videoProgress) {
            videoProgress.watchedDuration = watchedDuration;
            videoProgress.totalDuration = totalDuration;
            videoProgress.completed = completed || false;
            videoProgress.lastWatchedAt = new Date();
        } else {
            courseProgress.videoProgress.push({
                videoId,
                watchedDuration,
                totalDuration,
                completed: completed || false,
                lastWatchedAt: new Date()
            });
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Video progress updated",
            data: {
                courseProgress
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get video progress for a user
 * @route   GET /api/users/:userId/progress/video/:videoId
 * @access  Public
 */
const getVideoProgress = async (req, res, next) => {
    try {
        const { userId, videoId } = req.params;
        const { courseId } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const courseProgress = user.courseProgress.find(
            cp => cp.courseId.toString() === courseId
        );

        if (!courseProgress) {
            return res.status(200).json({
                success: true,
                data: null
            });
        }

        const videoProgress = courseProgress.videoProgress.find(
            vp => vp.videoId.toString() === videoId
        );

        res.status(200).json({
            success: true,
            data: videoProgress || null
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get course progress for a user
 * @route   GET /api/users/:userId/progress/course/:courseId
 * @access  Public
 */
const getCourseProgress = async (req, res, next) => {
    try {
        const { userId, courseId } = req.params;

        const user = await User.findById(userId)
            .populate('courseProgress.courseId')
            .populate('courseProgress.videoProgress.videoId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const courseProgress = user.courseProgress.find(
            cp => cp.courseId._id.toString() === courseId
        );

        if (!courseProgress) {
            return res.status(200).json({
                success: true,
                data: null
            });
        }

        // Calculate overall progress percentage
        const totalVideos = courseProgress.videoProgress.length;
        const completedVideos = courseProgress.videoProgress.filter(vp => vp.completed).length;
        const progressPercentage = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                ...courseProgress.toObject(),
                progressPercentage: Math.round(progressPercentage)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Record quiz attempt
 * @route   POST /api/users/:userId/quiz-attempt
 * @access  Public
 */
const recordQuizAttempt = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { courseId, score, totalQuestions, passed } = req.body;
        const Course = require('../models/course.model');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Get course to check quiz settings
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        // Find or create course progress
        let courseProgress = user.courseProgress.find(
            cp => cp.courseId.toString() === courseId
        );

        if (!courseProgress) {
            courseProgress = {
                courseId,
                videoProgress: [],
                quizAttempts: [],
                completed: false
            };
            user.courseProgress.push(courseProgress);
        }

        // Check max attempts limit
        const maxAttempts = course.quizSettings?.maxAttempts || 0;
        if (maxAttempts > 0 && courseProgress.quizAttempts.length >= maxAttempts) {
            return res.status(400).json({
                success: false,
                message: `Maximum attempts (${maxAttempts}) reached for this quiz`,
                attemptsRemaining: 0
            });
        }

        // Add quiz attempt
        const percentage = (score / totalQuestions) * 100;
        courseProgress.quizAttempts.push({
            score,
            totalQuestions,
            percentage,
            passed,
            attemptedAt: new Date()
        });

        // Mark course as completed if passed
        if (passed && !courseProgress.completed) {
            courseProgress.completed = true;
            courseProgress.completedAt = new Date();
        }

        await user.save();

        // Calculate attempts remaining
        const attemptsUsed = courseProgress.quizAttempts.length;
        const attemptsRemaining = maxAttempts > 0 ? maxAttempts - attemptsUsed : -1; // -1 = unlimited

        res.status(200).json({
            success: true,
            message: "Quiz attempt recorded",
            data: {
                courseProgress,
                attemptsUsed,
                attemptsRemaining,
                passingScore: course.quizSettings?.passingScore || 60
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all course progress for a user
 * @route   GET /api/users/:userId/progress
 * @access  Public
 */
const getAllCourseProgress = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate('courseProgress.courseId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Calculate progress percentage for each course
        const progressWithPercentages = user.courseProgress.map(cp => {
            const totalVideos = cp.videoProgress.length;
            const completedVideos = cp.videoProgress.filter(vp => vp.completed).length;
            const progressPercentage = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

            return {
                ...cp.toObject(),
                progressPercentage: Math.round(progressPercentage)
            };
        });

        res.status(200).json({
            success: true,
            data: progressWithPercentages
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Generate certificate for a completed course
 * @route   POST /api/users/:userId/certificate/:courseId
 * @access  Public
 */
const generateCertificate = async (req, res, next) => {
    try {
        const { userId, courseId } = req.params;
        const { generateCertificate: generateCertPDF } = require('../utils/certificateGenerator');
        const Course = require('../models/course.model');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Find course progress
        const courseProgress = user.courseProgress.find(
            cp => cp.courseId.toString() === courseId
        );

        if (!courseProgress || !courseProgress.completed) {
            return res.status(400).json({
                success: false,
                message: "Course not completed yet",
            });
        }

        // Get course details
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        // Generate certificate PDF
        const pdfBuffer = await generateCertPDF(
            user.name,
            course.title,
            courseProgress.completedAt || new Date()
        );

        // Mark certificate as generated
        if (!courseProgress.certificateGenerated) {
            courseProgress.certificateGenerated = true;
            await user.save();
        }

        // Send PDF as download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Certificate-${course.title.replace(/\s+/g, '-')}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all certificates for a user
 * @route   GET /api/users/:userId/certificates
 * @access  Public
 */
const getUserCertificates = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate('courseProgress.courseId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Filter completed courses with certificates
        const certificates = user.courseProgress
            .filter(cp => cp.completed && cp.certificateGenerated)
            .map(cp => ({
                courseId: cp.courseId._id,
                courseTitle: cp.courseId.title,
                completedAt: cp.completedAt,
                certificateGenerated: cp.certificateGenerated
            }));

        res.status(200).json({
            success: true,
            data: certificates
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Enroll user in a course
 * @route   POST /api/users/:userId/enroll/:courseId
 * @access  Public
 */
const enrollInCourse = async (req, res, next) => {
    try {
        const { userId, courseId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if already enrolled
        const alreadyEnrolled = user.enrolledCourses.some(
            ec => ec.courseId.toString() === courseId
        );

        if (alreadyEnrolled) {
            return res.status(400).json({
                success: false,
                message: "Already enrolled in this course",
            });
        }

        // Add enrollment
        user.enrolledCourses.push({
            courseId,
            enrolledAt: new Date()
        });

        await user.save();

        res.status(200).json({
            success: true,
            message: "Successfully enrolled in course",
            data: user.enrolledCourses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all enrolled courses for a user
 * @route   GET /api/users/:userId/enrolled-courses
 * @access  Public
 */
const getEnrolledCourses = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate('enrolledCourses.courseId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            data: user.enrolledCourses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Unenroll user from a course
 * @route   DELETE /api/users/:userId/enroll/:courseId
 * @access  Public
 */
const unenrollFromCourse = async (req, res, next) => {
    try {
        const { userId, courseId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Remove enrollment
        user.enrolledCourses = user.enrolledCourses.filter(
            ec => ec.courseId.toString() !== courseId
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: "Successfully unenrolled from course"
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/users/:userId/stats
 * @access  Public
 */
const getUserStats = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate('enrolledCourses.courseId')
            .populate('courseProgress.courseId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Calculate stats
        const totalEnrolled = user.enrolledCourses.length;
        const totalCompleted = user.courseProgress.filter(cp => cp.completed).length;
        const totalCertificates = user.courseProgress.filter(cp => cp.certificateGenerated).length;

        // Calculate total learning time (sum of video durations watched)
        let totalLearningMinutes = 0;
        user.courseProgress.forEach(cp => {
            cp.videoProgress.forEach(vp => {
                totalLearningMinutes += vp.watchedDuration / 60;
            });
        });

        // Get recent activity (last 10 quiz attempts)
        const recentActivity = [];
        user.courseProgress.forEach(cp => {
            if (cp.quizAttempts.length > 0) {
                const latestAttempt = cp.quizAttempts[cp.quizAttempts.length - 1];
                recentActivity.push({
                    courseId: cp.courseId,
                    date: latestAttempt.attemptedAt,
                    type: 'quiz',
                    passed: latestAttempt.passed
                });
            }
        });
        recentActivity.sort((a, b) => b.date - a.date);

        res.status(200).json({
            success: true,
            data: {
                totalEnrolled,
                totalCompleted,
                totalCertificates,
                totalLearningMinutes: Math.round(totalLearningMinutes),
                recentActivity: recentActivity.slice(0, 10)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add bookmark
 * @route   POST /api/users/:userId/bookmarks/:courseId
 * @access  Public
 */
const addBookmark = async (req, res, next) => {
    try {
        const { userId, courseId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if already bookmarked
        const alreadyBookmarked = user.bookmarkedCourses.some(
            bc => bc.courseId.toString() === courseId
        );

        if (alreadyBookmarked) {
            return res.status(400).json({
                success: false,
                message: "Course already bookmarked"
            });
        }

        user.bookmarkedCourses.push({
            courseId,
            bookmarkedAt: new Date()
        });

        await user.save();

        res.status(200).json({
            success: true,
            message: "Course bookmarked successfully",
            data: user.bookmarkedCourses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove bookmark
 * @route   DELETE /api/users/:userId/bookmarks/:courseId
 * @access  Public
 */
const removeBookmark = async (req, res, next) => {
    try {
        const { userId, courseId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.bookmarkedCourses = user.bookmarkedCourses.filter(
            bc => bc.courseId.toString() !== courseId
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: "Bookmark removed successfully",
            data: user.bookmarkedCourses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get bookmarked courses
 * @route   GET /api/users/:userId/bookmarks
 * @access  Public
 */
const getBookmarks = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).populate('bookmarkedCourses.courseId');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user.bookmarkedCourses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update learning streak
 * @route   POST /api/users/:userId/streak
 * @access  Public
 */
const updateStreak = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!user.learningStreak) {
            user.learningStreak = {
                currentStreak: 0,
                longestStreak: 0,
                lastLoginDate: null
            };
        }

        const lastLogin = user.learningStreak.lastLoginDate
            ? new Date(user.learningStreak.lastLoginDate)
            : null;

        if (lastLogin) {
            lastLogin.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                // Same day, no change
            } else if (daysDiff === 1) {
                // Consecutive day, increment streak
                user.learningStreak.currentStreak += 1;
                user.learningStreak.lastLoginDate = new Date();

                // Update longest streak if needed
                if (user.learningStreak.currentStreak > user.learningStreak.longestStreak) {
                    user.learningStreak.longestStreak = user.learningStreak.currentStreak;
                }
            } else {
                // Streak broken, reset to 1
                user.learningStreak.currentStreak = 1;
                user.learningStreak.lastLoginDate = new Date();
            }
        } else {
            // First login
            user.learningStreak.currentStreak = 1;
            user.learningStreak.longestStreak = 1;
            user.learningStreak.lastLoginDate = new Date();
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: user.learningStreak
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
};
