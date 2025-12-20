const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Document storage directory
const docDir = path.join(__dirname, "..", "uploads", "documents");

// Ensure document directory exists
if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
}

/**
 * Multer storage configuration for documents
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, docDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.fieldname}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, uniqueName);
    },
});

/**
 * File filter for document uploads
 */
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only documents are allowed (pdf, doc, docx)"));
    }
};

/**
 * Multer upload configuration for multiple documents
 */
const uploadDocs = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter,
});

module.exports = uploadDocs;
