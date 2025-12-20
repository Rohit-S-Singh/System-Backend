import mongoose from "mongoose";

const InterviewMessageSchema = new mongoose.Schema(
  {
    interviewRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewRequest",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("InterviewMessage", InterviewMessageSchema);
