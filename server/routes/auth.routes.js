const express = require("express");
const router = express.Router();
const { login, signup } = require("../controllers/auth.controller");
const {
    validateLogin,
    validateUserRegistration,
} = require("../middleware/validation");

// Authentication routes
router.post("/login", validateLogin, login);
router.post("/signup", validateUserRegistration, signup);

module.exports = router;
