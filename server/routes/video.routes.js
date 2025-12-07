const express = require("express");
const router = express.Router();
const {
    uploadVideo,
    getVideos,
    streamVideo,
    deleteVideo,
    getVideoByFilename,
} = require("../controllers/video.controller");
const upload = require("../config/multer");
const { validateVideoUpload } = require("../middleware/validation");

// Video routes
router.post("/upload", upload.single("video"), validateVideoUpload, uploadVideo);
router.get("/", getVideos);
router.get("/stream/:filename", streamVideo);
router.delete("/:id", deleteVideo);
router.get("/:filename", getVideoByFilename); // Legacy support

module.exports = router;
