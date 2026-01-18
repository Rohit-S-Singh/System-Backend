import mongoose from "mongoose";

const resumeProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },

  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "resumes",
    required: true,
  },

  rawText: String,

  parsedProfile: {
    skills: [String],
    roles: [String],
    experience: String,
    education: String,
    summary: String,
  },

  embedding: {
    type: [Number], // vector
    default: []
  }

}, { timestamps: true });

export default mongoose.model("resume_profiles", resumeProfileSchema);
