import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
    index: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },

  // 🔔 Notification category
  type: {
    type: String,
    enum: [
      // Connections
      "connection_request",
      "connection_accepted",
      "connection_rejected",

      // Messaging
      "message_received",
      "interview_message",

      // Interview lifecycle
      "interview_request",
      "interview_accepted",
      "interview_rejected",
      "interview_cancelled",
      "interview_completed",

      // Jobs / system
      "job_application",
      "email_sent",
      "profile_update",
      "system_alert",
      "welcome",
      "referral_bonus",
      "welcome_bonus",
      "subscription_purchase"
    ],
    required: true
  },

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  // 🔗 Direct Interview reference (NEW)
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "interviews",
    default: null
  },

  // 🧠 Extra payload (still flexible)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  isRead: {
    type: Boolean,
    default: false
  },

  readAt: {
    type: Date
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  // 🔥 Priority for UI ordering
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },

  // 🎯 CTA support
  actionUrl: {
    type: String
  },

  actionText: {
    type: String
  }

}, { timestamps: true });

/* ---------------- INDEXES ---------------- */

// Fast unread notifications
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Soft delete support
NotificationSchema.index({ recipient: 1, isDeleted: 1 });

// Type-based filtering
NotificationSchema.index({ type: 1, recipient: 1 });

// Interview-specific queries (NEW)
NotificationSchema.index({ interview: 1 });

const Notification =
  mongoose.models.notifications ||
  mongoose.model("notifications", NotificationSchema);

export default Notification;
