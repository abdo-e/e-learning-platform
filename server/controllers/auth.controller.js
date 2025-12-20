const User = require("../models/user.model");
const Company = require("../models/company.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../middleware/auth");

const SALT_ROUNDS = 10;

/**
 * @desc    User login
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            // Generate JWT token
            const token = generateToken(user._id);

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid password",
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    User signup/registration
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
    try {
        const { name, email, password, role, companyName, industry, size } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create new user with hashed password
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || "user", // Default role
        });

        await newUser.save();

        // If it's a corporate admin, create the company
        if (role === "corporate_admin") {
            if (!companyName) {
                return res.status(400).json({
                    success: false,
                    message: "Company name is required for corporate registration",
                });
            }

            const company = new Company({
                name: companyName,
                industry,
                size: size || "1-10",
                contactPerson: {
                    name,
                    email,
                    position: "Administrator",
                },
                admins: [
                    {
                        userId: newUser._id,
                        addedAt: new Date(),
                    },
                ],
            });
            await company.save();

            // Link user to company
            newUser.company = company._id;
            await newUser.save();
        }

        // Generate JWT token
        const token = generateToken(newUser._id);

        res.status(201).json({
            success: true,
            message:
                role === "corporate_admin"
                    ? "Corporate account and company created successfully"
                    : "User created successfully",
            token,
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    signup,
};
