const User = require('../models/user.model');
const Company = require('../models/company.model');

/**
 * Middleware to check if user has instructor role
 */
exports.requireInstructor = async (req, res, next) => {
    try {
        if (req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Instructor role required.'
            });
        }

        // Check if instructor is approved
        const user = await User.findById(req.user._id);
        if (!user.instructorProfile || !user.instructorProfile.isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Your instructor application is pending approval'
            });
        }

        next();
    } catch (error) {
        console.error('Instructor check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking instructor status',
            error: error.message
        });
    }
};

/**
 * Middleware to check if user has corporate admin role
 */
exports.requireCorporateAdmin = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Find company where user is an admin
        const company = await Company.findOne({
            'admins.userId': userId,
            registrationStatus: 'approved'
        });

        if (!company) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Corporate admin role required.'
            });
        }

        // Attach company to request for use in controllers
        req.company = company;
        next();
    } catch (error) {
        console.error('Corporate admin check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking corporate admin status',
            error: error.message
        });
    }
};

/**
 * Middleware to check if user belongs to a company
 */
exports.requireCompanyAccess = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user.company) {
            return res.status(403).json({
                success: false,
                message: 'You are not associated with any company'
            });
        }

        const company = await Company.findById(user.company);

        if (!company || company.registrationStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Your company is not approved or does not exist'
            });
        }

        // Check if employee is active
        const employee = company.employees.find(
            e => e.userId.toString() === userId.toString()
        );

        if (!employee || !employee.isActive) {
            return res.status(403).json({
                success: false,
                message: 'You are not an active employee of this company'
            });
        }

        req.company = company;
        req.employee = employee;
        next();
    } catch (error) {
        console.error('Company access check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking company access',
            error: error.message
        });
    }
};

/**
 * Middleware to check if user has admin or instructor role
 */
exports.requireAdminOrInstructor = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Instructor role required.'
        });
    }
    next();
};

/**
 * Middleware to check if user has admin or corporate admin role
 */
exports.requireAdminOrCorporateAdmin = async (req, res, next) => {
    try {
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user is a corporate admin
        const userId = req.user._id;
        const company = await Company.findOne({
            'admins.userId': userId,
            registrationStatus: 'approved'
        });

        if (!company) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Corporate Admin role required.'
            });
        }

        req.company = company;
        next();
    } catch (error) {
        console.error('Admin/Corporate admin check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking admin status',
            error: error.message
        });
    }
};

/**
 * Middleware to check multiple roles
 */
exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
};
