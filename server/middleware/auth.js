const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Protect routes - verify JWT token and populate req.user
 */
exports.protect = async (req, res, next) => {
    try {
        let token;
        console.log('[AUTH DEBUG] Headers:', req.headers.authorization ? 'Present' : 'Missing');

        // Check if Authorization header exists and starts with Bearer
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. Please login.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

            // Get user from database (excluding password)
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found. Token invalid.'
                });
            }

            // Attach user to request object
            req.user = user;
            console.log('[AUTH DEBUG] User authenticated:', user.email);
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Token invalid or expired.'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in authentication',
            error: error.message
        });
    }
};

/**
 * Generate JWT token
 */
exports.generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        {
            expiresIn: process.env.JWT_EXPIRE || '30d'
        }
    );
};
