/**
 * Centralized error handling middleware
 */

/**
 * Handle Mongoose validation errors
 */
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((error) => error.message);
    return {
        statusCode: 400,
        message: "Validation Error",
        errors,
    };
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    return {
        statusCode: 409,
        message: `${field} already exists`,
    };
};

/**
 * Handle Mongoose cast errors (invalid ObjectId)
 */
const handleCastError = (err) => {
    return {
        statusCode: 400,
        message: `Invalid ${err.path}: ${err.value}`,
    };
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = err;
    error.message = err.message;

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const validationError = handleValidationError(err);
        return res.status(validationError.statusCode).json({
            success: false,
            message: validationError.message,
            errors: validationError.errors,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const duplicateError = handleDuplicateKeyError(err);
        return res.status(duplicateError.statusCode).json({
            success: false,
            message: duplicateError.message,
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === "CastError") {
        const castError = handleCastError(err);
        return res.status(castError.statusCode).json({
            success: false,
            message: castError.message,
        });
    }

    // Multer file upload errors
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File size too large. Maximum size is 100MB",
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: error.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

module.exports = { errorHandler, notFound };
