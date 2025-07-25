// models/EmailLog.js

import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    sentBy: { type: String, required: true },       // Sender (user email)
    sentTo: { type: String, required: true },       // Receiver (recruiter email)
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter", required: true },
    subject: String,
    body: String,
    attachmentName: String,
    threadId: String, // Gmail thread ID
    status: {
      type: String,
      enum: ["thread_start", "follow_up", "closed"],
      default: "Sent"
    },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("EmailLog", emailLogSchema);
