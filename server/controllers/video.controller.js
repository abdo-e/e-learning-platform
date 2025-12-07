const fs = require("fs");
const path = require("path");
const Video = require("../models/video.model");

/**
 * @desc    Upload video to file system
 * @route   POST /api/videos/upload
 * @access  Public
 */
const uploadVideo = async (req, res, next) => {
    try {
        // File is already saved by multer to videos directory
        const video = await Video.create({
            title: req.body.title || req.file.originalname,
            filename: req.file.filename,
            filePath: req.file.path,
            duration: req.body.duration || 0,
        });

        res.status(201).json({
            message: "Video uploaded successfully",
            videoId: video._id,
        });
    } catch (error) {
        // If database save fails, delete the uploaded file
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting file:", err);
            });
        }
        next(error);
    }
};

/**
 * @desc    Get all videos
 * @route   GET /api/videos
 * @access  Public
 */
const getVideos = async (req, res, next) => {
    try {
        const videos = await Video.find();
        res.status(200).json(videos); // Return array directly
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Stream video with range support
 * @route   GET /api/videos/stream/:filename
 * @access  Public
 */
const streamVideo = async (req, res, next) => {
    try {
        const { filename } = req.params;

        // Find video in database
        const video = await Video.findOne({ filename });

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        const videoPath = video.filePath;

        // Check if file exists
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
                success: false,
                message: "Video file not found on server",
            });
        }

        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        // Determine content type based on file extension
        const ext = path.extname(videoPath).toLowerCase();
        const contentType = {
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".avi": "video/x-msvideo",
            ".mov": "video/quicktime",
            ".mkv": "video/x-matroska",
        }[ext] || "video/mp4";

        // If no range header, stream entire file
        if (!range) {
            res.writeHead(200, {
                "Content-Length": fileSize,
                "Content-Type": contentType,
            });
            fs.createReadStream(videoPath).pipe(res);
            return;
        }

        // Parse range header
        const CHUNK_SIZE = 10 ** 6; // 1MB chunks
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
        const contentLength = end - start + 1;

        console.log(`📽 Streaming: ${filename} | Range: ${start}-${end}/${fileSize}`);

        // Send partial content
        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": contentType,
        });

        const stream = fs.createReadStream(videoPath, { start, end });
        stream.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) {
                res.sendStatus(500);
            }
        });
        stream.pipe(res);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete video
 * @route   DELETE /api/videos/:id
 * @access  Public
 */
const deleteVideo = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        // Delete file from file system
        if (fs.existsSync(video.filePath)) {
            fs.unlinkSync(video.filePath);
        }

        // Delete from database
        await Video.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Video deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get video by filename (legacy support)
 * @route   GET /api/videos/:filename
 * @access  Public
 */
const getVideoByFilename = async (req, res, next) => {
    try {
        const { filename } = req.params;
        const video = await Video.findOne({ filename });

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found",
            });
        }

        const videoPath = video.filePath;

        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({
                success: false,
                message: "Video file not found on server",
            });
        }

        const ext = path.extname(videoPath).toLowerCase();
        const contentType = {
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".avi": "video/x-msvideo",
            ".mov": "video/quicktime",
            ".mkv": "video/x-matroska",
        }[ext] || "video/mp4";

        res.setHeader("Content-Type", contentType);
        fs.createReadStream(videoPath).pipe(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadVideo,
    getVideos,
    streamVideo,
    deleteVideo,
    getVideoByFilename,
};
