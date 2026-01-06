// models/InterviewScheduled.js
import mongoose from "mongoose";

const InterviewScheduledSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    additionalDetails: {
      type: String,
    },
    reminder10MinSent: { type: Boolean, default: false },
reminder2MinSent: { type: Boolean, default: false },
meetLink: { type: String },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

export default mongoose.model("InterviewScheduled", InterviewScheduledSchema);
