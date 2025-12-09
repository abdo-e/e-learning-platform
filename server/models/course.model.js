const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    required: true,
  },
  // Instructor information
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Pricing and marketplace
  courseType: {
    type: String,
    enum: ['free', 'paid', 'premium'], // premium = subscription only
    default: 'free'
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  discount: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    validUntil: {
      type: Date
    }
  },
  // Preview content for paid courses
  previewVideoUrl: {
    type: String
  },
  previewDescription: {
    type: String
  },
  // Enrollment and revenue tracking
  totalEnrollments: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  // Corporate licensing
  corporateLicensing: {
    enabled: {
      type: Boolean,
      default: false
    },
    pricePerUser: {
      type: Number,
      default: 0
    },
    minimumUsers: {
      type: Number,
      default: 10
    }
  },
  videos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video", // Reference to the Video model
    },
  ],
  quiz: {
    type: [
      {
        question: { type: String, required: true },
        options: [
          {
            text: { type: String, required: true },
            correct: { type: Boolean, required: true },
          },
        ],
      },
    ],
    validate: [arrayLimit, "{PATH} exceeds the limit of 5 questions"],
  },
  quizSettings: {
    timeLimit: {
      type: Number,
      default: 0, // 0 = no time limit, otherwise in seconds
    },
    maxAttempts: {
      type: Number,
      default: 0, // 0 = unlimited attempts
    },
    passingScore: {
      type: Number,
      default: 60, // percentage required to pass
      min: 0,
      max: 100,
    },
  },
  ratings: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  discussions: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      message: {
        type: String,
        required: true,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      replies: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          message: {
            type: String,
            required: true,
            trim: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

function arrayLimit(val) {
  return val.length <= 5; // Limit quiz to 5 questions
}

module.exports = mongoose.model("Course", courseSchema);
