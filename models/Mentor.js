// models/Mentor.js
import mongoose from "mongoose";

const MentorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true
    },

    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended"],
      default: "active" // ✅ avoids booking issues
    },

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

    // ✅ Matches frontend (pricePerHour)
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

    /* =====================================================
       SIMPLE AVAILABILITY (USED BY FRONTEND UI)
    ===================================================== */
    availability: {
      type: String,
      enum: ["Available", "Busy"],
      default: "Available"
    },

    /* =====================================================
       SLOT-BASED AVAILABILITY (FOR FUTURE USE)
    ===================================================== */
    availabilitySlots: [
      {
        day: {
          type: String, // Monday, Tuesday, etc.
          required: true
        },
        slots: [
          {
            type: String // "10:00-11:00"
          }
        ]
      }
    ],

    rating: {
      type: Number,
      default: 4.5
    },

    // ✅ Matches frontend (completedInterviews)
    completedInterviews: {
      type: Number,
      default: 0
    },

    isVerified: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("mentors", MentorSchema);
