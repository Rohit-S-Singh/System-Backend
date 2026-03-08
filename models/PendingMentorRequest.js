// models/PendingMentorRequest.js
import mongoose from "mongoose";

const PendingMentorRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mentors",
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    adminRemarks: {
      type: String
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users" // admin
    },

    reviewedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "pending_mentor_requests",
  PendingMentorRequestSchema
);
