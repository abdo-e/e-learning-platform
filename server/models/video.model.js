const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Video", videoSchema);
