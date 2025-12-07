const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let gfs = null;

/**
 * Initialize GridFS bucket for video storage
 */
const initGridFS = () => {
    const conn = mongoose.connection;

    conn.once("open", () => {
        try {
            gfs = new GridFSBucket(conn.db, {
                bucketName: "videos",
            });
            console.log("✅ GridFS initialized successfully");
        } catch (error) {
            console.error("❌ GridFS initialization failed:", error);
        }
    });

    conn.on("error", (err) => {
        console.error("❌ MongoDB connection error (GridFS):", err);
    });
};

/**
 * Get GridFS instance
 * @returns {GridFSBucket|null} GridFS bucket instance or null if not initialized
 */
const getGFS = () => {
    return gfs;
};

module.exports = { initGridFS, getGFS };
