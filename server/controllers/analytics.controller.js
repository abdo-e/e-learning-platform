const User = require("../models/user.model");
const Course = require("../models/course.model");

/**
 * @desc    Get analytics overview
 * @route   GET /api/analytics/overview
 * @access  Public
 */
const getOverview = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalCourses = await Course.countDocuments();
        const adminUsers = await User.countDocuments({ role: 'admin' });
        const regularUsers = totalUsers - adminUsers;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalCourses,
                adminUsers,
                regularUsers,
                activeUsers: totalUsers, // For now, all users are considered active
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user growth data (monthly)
 * @route   GET /api/analytics/user-growth
 * @access  Public
 */
const getUserGrowth = async (req, res, next) => {
    try {
        const users = await User.find().select('createdAt');

        // Group users by month
        const monthlyData = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize all months with 0
        months.forEach(month => {
            monthlyData[month] = 0;
        });

        // Count users per month
        users.forEach(user => {
            if (user.createdAt) {
                const month = months[new Date(user.createdAt).getMonth()];
                monthlyData[month]++;
            }
        });

        const userGrowth = months.map(month => ({
            month,
            count: monthlyData[month]
        }));

        res.status(200).json({
            success: true,
            data: userGrowth
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get course statistics
 * @route   GET /api/analytics/course-stats
 * @access  Public
 */
const getCourseStats = async (req, res, next) => {
    try {
        const courses = await Course.find().select('createdAt category difficulty');

        // Group courses by month
        const monthlyData = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize all months with 0
        months.forEach(month => {
            monthlyData[month] = 0;
        });

        // Count courses per month
        courses.forEach(course => {
            if (course.createdAt) {
                const month = months[new Date(course.createdAt).getMonth()];
                monthlyData[month]++;
            }
        });

        const courseGrowth = months.map(month => ({
            month,
            count: monthlyData[month]
        }));

        // Category distribution
        const categoryStats = {};
        courses.forEach(course => {
            const category = course.category || 'Uncategorized';
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });

        // Difficulty distribution
        const difficultyStats = {};
        courses.forEach(course => {
            const difficulty = course.difficulty || 'Unknown';
            difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1;
        });

        res.status(200).json({
            success: true,
            data: {
                courseGrowth,
                categoryStats,
                difficultyStats
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get popular courses
 * @route   GET /api/analytics/popular-courses
 * @access  Public
 */
const getPopularCourses = async (req, res, next) => {
    try {
        const courses = await Course.find()
            .select('title category videos')
            .limit(10)
            .lean();

        const popularCourses = courses.map(course => ({
            title: course.title,
            category: course.category,
            videoCount: course.videos ? course.videos.length : 0
        }));

        res.status(200).json({
            success: true,
            data: popularCourses
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverview,
    getUserGrowth,
    getCourseStats,
    getPopularCourses
};
