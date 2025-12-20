// models/InterviewHistory.js
import mongoose from "mongoose";

const InterviewHistorySchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mentors",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    date: Date,
    day: String,
    time: String,
    duration: String,
    message: String,
    additionalDetails: String,

    feedback: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["completed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("InterviewHistory", InterviewHistorySchema);
