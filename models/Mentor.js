// models/Mentor.js
import mongoose from "mongoose";

const MentorSchema = new mongoose.Schema(
  {
    /* ===============================
       USER LINK
    =============================== */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true
    },

    /* ===============================
       PERSONAL DETAILS
    =============================== */
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true
    },

    avatar: {
      type: String
    },

    /* ===============================
       ACCOUNT STATUS
    =============================== */
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended"],
      default: "pending"
    },

    approvedByAdmin: {
      type: Boolean,
      default: false
    },

    /* ===============================
       PROFESSIONAL DETAILS
    =============================== */
    expertise: {
      type: [String],
      required: true
    },

    experience: {
      type: Number,
      required: true
    },

    bio: {
      type: String
    },

    pricePerHour: {
      type: Number,
      required: true
    },

    interviewTypes: [
      {
        type: String,
        enum: [
          "technical",
          "behavioral",
          "mock",
          "resume_review",
          "career_guidance",
          "system_design"
        ]
      }
    ],

    /* ===============================
       AVAILABILITY
    =============================== */
    availability: {
      type: String,
      enum: ["Available", "Busy"],
      default: "Available"
    },

    availabilitySlots: [
      {
        day: {
          type: String
        },
        slots: [
          {
            type: String // "10:00-11:00"
          }
        ]
      }
    ],

    timezone: {
      type: String,
      default: "Asia/Kolkata"
    },

    /* ===============================
       🔥 SCHEDULED INTERVIEWS (NEW)
    =============================== */
    scheduledInterviews: [
      {
        interviewId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "interviews"
        },

        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true
        },

        date: {
          type: Date,
          required: true
        },

        startTime: {
          type: String, // "10:00"
          required: true
        },

        endTime: {
          type: String, // "11:00"
          required: true
        },

        status: {
          type: String,
          enum: ["scheduled", "completed", "cancelled", "no_show"],
          default: "scheduled"
        }
      }
    ],

    /* ===============================
       METRICS
    =============================== */
    rating: {
      type: Number,
      default: 4.5
    },

    completedInterviews: {
      type: Number,
      default: 0
    },

    isVerified: {
      type: Boolean,
      default: true
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("mentors", MentorSchema);
