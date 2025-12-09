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
    enum: ['admin', 'user', 'instructor', 'corporate_admin'],
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
  },
  // Subscription reference
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'cancelled', 'expired'],
    default: 'none'
  },
  // Company association (for corporate employees)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  // Instructor profile
  instructorProfile: {
    isApproved: {
      type: Boolean,
      default: false
    },
    bio: {
      type: String,
      trim: true
    },
    expertise: [{
      type: String,
      trim: true
    }],
    totalEarnings: {
      type: Number,
      default: 0
    },
    availableBalance: {
      type: Number,
      default: 0
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    totalCourses: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    payoutDetails: {
      accountType: {
        type: String,
        enum: ['bank', 'paypal', 'stripe']
      },
      accountInfo: {
        type: Map,
        of: String
      }
    },
    appliedAt: {
      type: Date
    },
    approvedAt: {
      type: Date
    }
  },
  // Purchased courses (for marketplace)
  purchasedCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    price: {
      type: Number,
      required: true
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    }
  }]
}, { timestamps: true }); // Adds createdAt and updatedAt fields

const User = mongoose.model('User', userSchema);

module.exports = User;