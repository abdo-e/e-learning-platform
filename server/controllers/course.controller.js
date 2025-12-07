const Course = require("../models/course.model");
const Video = require("../models/video.model");

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Public
 */
const createCourse = async (req, res, next) => {
    try {
        const { title, description, category, difficulty, videos, quiz } = req.body;

        // Validate video IDs if provided
        if (videos && videos.length > 0) {
            const validVideos = await Video.find({ _id: { $in: videos } });

            if (validVideos.length !== videos.length) {
                return res.status(400).json({
                    success: false,
                    message: "One or more video IDs are invalid",
                });
            }
        }

        // Validate quiz structure
        if (quiz && Array.isArray(quiz)) {
            for (const item of quiz) {
                if (!item.question || !Array.isArray(item.options)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid quiz item structure",
                    });
                }

                for (const option of item.options) {
                    if (!option.text || typeof option.correct !== "boolean") {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid quiz option structure",
                        });
                    }
                }
            }
        }

        // Create the course
        const newCourse = new Course({
            title,
            description,
            category,
            difficulty,
            videos: videos || [],
            quiz: quiz || [],
        });

        const savedCourse = await newCourse.save();

        res.status(201).json({
            success: true,
            data: savedCourse,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all courses with optional filtering and sorting
 * @route   GET /api/courses?search=&category=&difficulty=&minRating=&sortBy=
 * @access  Public
 */
const getCourses = async (req, res, next) => {
    try {
        const { search, category, difficulty, sortBy, minRating } = req.query;

        let query = {};

        // Search in title and description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }

        // Filter by difficulty
        if (difficulty && difficulty !== 'all') {
            query.difficulty = difficulty;
        }

        // Filter by minimum rating
        if (minRating) {
            query.averageRating = { $gte: parseFloat(minRating) };
        }

        // Sorting
        let sort = {};
        if (sortBy === 'newest') {
            sort.createdAt = -1;
        } else if (sortBy === 'popular') {
            sort.totalRatings = -1;
        } else if (sortBy === 'rating') {
            sort.averageRating = -1;
        } else {
            sort.createdAt = -1; // Default: newest first
        }

        const courses = await Course.find(query).populate("videos").sort(sort);

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get course by ID
 * @route   GET /api/courses/:id
 * @access  Public
 */
const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id).populate("videos");

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        res.status(200).json({
            success: true,
            data: course,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Public
 */
const updateCourse = async (req, res, next) => {
    try {
        const { videos, ...updateData } = req.body;

        // Validate video IDs if provided
        if (videos) {
            const validVideos = await Video.find({ _id: { $in: videos } });
            updateData.videos = validVideos.map((v) => v._id);
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        ).populate("videos");

        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        res.status(200).json({
            success: true,
            data: updatedCourse,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Public
 */
const deleteCourse = async (req, res, next) => {
    try {
        const deletedCourse = await Course.findByIdAndDelete(req.params.id);

        if (!deletedCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add rating to a course
 * @route   POST /api/courses/:courseId/ratings
 * @access  Public
 */
const addRating = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { userId, rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        // Check if user already rated this course
        const existingRatingIndex = course.ratings.findIndex(
            r => r.userId.toString() === userId
        );

        if (existingRatingIndex !== -1) {
            // Update existing rating
            course.ratings[existingRatingIndex] = {
                userId,
                rating,
                comment: comment || "",
                createdAt: new Date()
            };
        } else {
            // Add new rating
            course.ratings.push({
                userId,
                rating,
                comment: comment || "",
                createdAt: new Date()
            });
        }

        // Recalculate average rating
        const totalRatings = course.ratings.length;
        const sumRatings = course.ratings.reduce((sum, r) => sum + r.rating, 0);
        course.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
        course.totalRatings = totalRatings;

        await course.save();

        res.status(200).json({
            success: true,
            message: existingRatingIndex !== -1 ? "Rating updated successfully" : "Rating added successfully",
            data: {
                averageRating: course.averageRating,
                totalRatings: course.totalRatings
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get ratings for a course
 * @route   GET /api/courses/:courseId/ratings
 * @access  Public
 */
const getRatings = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId)
            .populate('ratings.userId', 'name email');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        res.status(200).json({
            success: true,
            data: {
                ratings: course.ratings,
                averageRating: course.averageRating,
                totalRatings: course.totalRatings
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add discussion to a course
 * @route   POST /api/courses/:courseId/discussions
 * @access  Public
 */
const addDiscussion = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { userId, message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty",
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        course.discussions.push({
            userId,
            message: message.trim(),
            createdAt: new Date(),
            replies: []
        });

        await course.save();

        res.status(201).json({
            success: true,
            message: "Discussion added successfully",
            data: course.discussions[course.discussions.length - 1]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add reply to a discussion
 * @route   POST /api/courses/:courseId/discussions/:discussionId/replies
 * @access  Public
 */
const addReply = async (req, res, next) => {
    try {
        const { courseId, discussionId } = req.params;
        const { userId, message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty",
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const discussion = course.discussions.id(discussionId);
        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found",
            });
        }

        discussion.replies.push({
            userId,
            message: message.trim(),
            createdAt: new Date()
        });

        await course.save();

        res.status(201).json({
            success: true,
            message: "Reply added successfully",
            data: discussion.replies[discussion.replies.length - 1]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get discussions for a course
 * @route   GET /api/courses/:courseId/discussions
 * @access  Public
 */
const getDiscussions = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId)
            .populate('discussions.userId', 'name email')
            .populate('discussions.replies.userId', 'name email');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        res.status(200).json({
            success: true,
            data: course.discussions
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
};
