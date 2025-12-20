import mongoose from "mongoose";

const InterviewRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    receiverRole: {
      type: String,
      enum: ["mentor", "recruiter"],
      required: true,
    },

    interviewType: String,
    duration: Number,

    proposedDate: String,
    proposedTime: String,
    timezone: String,

    skills: [String],

    objective: String,
    initialMessage: String,

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("InterviewRequest", InterviewRequestSchema);
