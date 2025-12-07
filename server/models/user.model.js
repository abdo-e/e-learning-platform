const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"]
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  // Legacy field - kept for backward compatibility during migration
  doneCourses: [
    {
      type: String // Array of course names (strings)
    }
  ],
  // New progress tracking structure
  courseProgress: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
      },
      videoProgress: [
        {
          videoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video'
          },
          watchedDuration: {
            type: Number,
            default: 0
          }, // seconds watched
          totalDuration: {
            type: Number,
            default: 0
          }, // total video duration
          completed: {
            type: Boolean,
            default: false
          },
          lastWatchedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      quizAttempts: [
        {
          score: {
            type: Number,
            required: true
          },
          totalQuestions: {
            type: Number,
            required: true
          },
          percentage: {
            type: Number
          },
          passed: {
            type: Boolean,
            required: true
          },
          attemptedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date
      },
      certificateGenerated: {
        type: Boolean,
        default: false
      }
    }
  ],
  enrolledCourses: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
      },
      enrolledAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  bookmarkedCourses: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
      },
      bookmarkedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  learningStreak: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastLoginDate: {
      type: Date
    }
  }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

const User = mongoose.model('User', userSchema);

module.exports = User;