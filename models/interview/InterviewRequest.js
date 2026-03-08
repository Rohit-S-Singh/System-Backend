// models/RequestInterview.js
import mongoose from "mongoose";

const RequestInterviewSchema = new mongoose.Schema(
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
      required: true,
    },

    additionalDetails: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    // 🔑 EMAIL ACTION TOKEN
    token: {
      type: String,
      required: true,
    },

    // ⏳ OPTIONAL (but best practice)
    tokenExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("RequestInterview", RequestInterviewSchema);
