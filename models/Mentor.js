// models/Mentor.js
import mongoose from "mongoose";

const MentorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
    unique: true
  },

  status: {
    type: String,
    enum: ["pending", "active", "inactive", "suspended"],
    default: "pending"
  },

  expertise: {
    type: [String],           // ["React", "System Design", "DSA"]
    required: true
  },

  experience: {
    type: Number,             // years
    required: true
  },

  bio: {
    type: String
  },

  hourlyRate: {
    type: Number              // optional monetization later
  },

  interviewTypes: [{
    type: String,
    enum: [
      "technical",
      "behavioral",
      "mock",
      "resume_review",
      "career_guidance"
    ]
  }],

  availability: [{
    day: {
      type: String,           // Monday, Tuesday
    },
    slots: [{
      type: String            // "10:00-11:00"
    }]
  }],

  rating: {
    type: Number,
    default: 0
  },

  totalInterviews: {
    type: Number,
    default: 0
  },

  isVerified: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("mentors", MentorSchema);
