import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  type: {
    type: String,
    enum: [
      'connection_request',
      'connection_accepted',
      'connection_rejected',
      'message_received',
      'group_invitation',
      'job_application',
      'email_sent',
      'profile_update',
      'system_alert',
      'welcome',
      'interview_request',
      'interview_accepted',
      'interview_rejected',
      'interview_cancelled',
      'referral_bonus',
      'welcome_bonus',
      'interview_completed',
      'subscription_purchase'
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
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String
  },
  actionText: {
    type: String
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isDeleted: 1 });
NotificationSchema.index({ type: 1, recipient: 1 });

const Notification = mongoose.models.notifications || mongoose.model("notifications", NotificationSchema);

export default Notification; 