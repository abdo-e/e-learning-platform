/**
 * Request validation middleware
 */

/**
 * Validate user registration data
 */
const validateUserRegistration = (req, res, next) => {
    const { name, email, password, role, companyName, industry, size } = req.body;

    // Debug logging
    console.log("📝 Signup request received:", { name, email, role, companyName, passwordLength: password?.length });

    if (!name || !email || !password) {
        console.log("❌ Validation failed: Missing fields");
        return res.status(400).json({
            success: false,
            message: "All fields are required (name, email, password)",
        });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log("❌ Validation failed: Invalid email format");
        return res.status(400).json({
            success: false,
            message: "Invalid email format",
        });
    }

    // Password length validation
    if (password.length < 6) {
        console.log(`❌ Validation failed: Password too short (${password.length} chars)`);
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long",
        });
    }

    // Corporate specific validation
    if (role === "corporate_admin" && !companyName) {
        console.log("❌ Validation failed: Missing company name");
        return res.status(400).json({
            success: false,
            message: "Company name is required for corporate registration",
        });
    }

    // Corporate specific validation
    if (role === 'corporate_admin') {
        if (!companyName || !industry || !size) {
            console.log("❌ Validation failed: Missing company details for corporate_admin");
            return res.status(400).json({
                success: false,
                message: "Company name, industry, and size are required for corporate registration",
            });
        }
    }

    console.log("✅ Validation passed");
    next();
};

/**
 * Validate login credentials
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required",
        });
    }

    next();
};

/**
 * Validate course creation data
 */
const validateCourseCreation = (req, res, next) => {
    const { title, description, category, difficulty, videos, quiz } = req.body;

    if (!title || !description || !category || !difficulty) {
        return res.status(400).json({
            success: false,
            message: "Title, description, category, and difficulty are required",
        });
    }

    // Validate difficulty level
    const validDifficulties = ["Beginner", "Intermediate", "Advanced"];
    if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({
            success: false,
            message: "Difficulty must be one of: Beginner, Intermediate, Advanced",
        });
    }

    // Validate videos array
    if (videos && !Array.isArray(videos)) {
        return res.status(400).json({
            success: false,
            message: "Videos must be an array",
        });
    }

    // Validate quiz array
    if (quiz && !Array.isArray(quiz)) {
        return res.status(400).json({
            success: false,
            message: "Quiz must be an array",
        });
    }

    next();
};

/**
 * Validate video upload data
 */
const validateVideoUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No video file uploaded",
        });
    }

    next();
};

/**
 * Validate done course data
 */
const validateDoneCourse = (req, res, next) => {
    const { courseName } = req.body;

    if (!courseName || typeof courseName !== "string" || courseName.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Course name is required and must be a non-empty string",
        });
    }

    next();
};

module.exports = {
    validateUserRegistration,
    validateLogin,
    validateCourseCreation,
    validateVideoUpload,
    validateDoneCourse,
};
