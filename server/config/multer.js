const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Video storage directory
const videoDir = path.join(__dirname, "..", "videos");

// Ensure video directory exists
if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}

// Ensure temp upload directory exists
const uploadDir = process.env.UPLOAD_DIR || "/tmp/uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer storage configuration for permanent video storage
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, videoDir); // Store directly in videos folder
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, uniqueName);
    },
});

/**
 * File filter for video uploads
 */
const fileFilter = (req, file, cb) => {
    const allowedTypes = /mp4|webm|avi|mov|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only video files are allowed (mp4, webm, avi, mov, mkv)"));
    }
};

/**
 * Multer upload configuration
 */
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 400 * 1024 * 1024, // 400MB default
    },
    fileFilter: fileFilter,
});

module.exports = upload;
