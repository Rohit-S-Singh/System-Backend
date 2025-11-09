import mongoose from "mongoose";

const mentorProfileSchema = new mongoose.Schema({
  expertise: [
    {
      type: String,
      required: true,
      trim: true
    }
  ],
  experience: {
    type: Number, // years of experience
    default: 0,
    min: 0
  },
  bio: {
    type: String,
    trim: true
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  availability: [
    {
      day: {
        type: String,
        required: true
      },
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      }
    }
  ],
  interviewTypes: [
    {
      type: String,
      enum: [
        "technical",
        "behavioral",
        "mock",
        "resume_review",
        "career_guidance",
        "other"
      ]
    }
  ]
});

export default mentorProfileSchema;
