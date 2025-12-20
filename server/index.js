require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/database");
const routes = require("./routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
connectDB();

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Coficab E-Learning API",
    version: "2.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      courses: "/api/courses",
      videos: "/api/videos",
      analytics: "/api/analytics",
    },
  });
});

// API Routes
const instructorRoutes = require("./routes/instructor.routes");
app.use("/api", routes);
app.use("/api/instructor", instructorRoutes);

// Diagnostic route
app.get("/api/test-route", (req, res) => {
  res.json({ message: "API is working correctly" });
});

// Legacy video upload route (frontend uses /upload instead of /api/videos/upload)
const upload = require("./config/multer");
const { uploadVideo } = require("./controllers/video.controller");
const { validateVideoUpload } = require("./middleware/validation");
app.post("/upload", upload.single("video"), validateVideoUpload, uploadVideo);

// Legacy routes for backward compatibility
const { login, signup } = require("./controllers/auth.controller");
const { validateLogin, validateUserRegistration } = require("./middleware/validation");
app.post("/login", validateLogin, login);
app.post("/signup", validateUserRegistration, signup);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});
