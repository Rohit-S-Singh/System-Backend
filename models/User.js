import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  givenName: {
    type: String,
  },
  familyName: {
    type: String,
  },
  picture: {
    type: String,
  },
  locale: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
  },
  password: {
    type: String,
  },
  phone: {
    type: Number,
  },
  online: {
    type: Boolean,
    default: false,
  },
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  tokenExpiry: {
    type: Date,
  },

  // ✅ HTML email template field
  htmlEmailTemplate: {
    rawTemplate: {
      type: String,
    },
    placeholders: {
      type: Object,
    },
    finalHtml: {
      type: String,
    },
  },

  followupTemplate: {
    type: [String],
  },
  
  // Connection-related fields
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
  connectionCount: {
    type: Number,
    default: 0
  },
  pendingConnections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
  sentConnectionRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
  
  // Notification-related fields
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    connectionRequests: {
      type: Boolean,
      default: true
    },
    messages: {
      type: Boolean,
      default: true
    },
    jobUpdates: {
      type: Boolean,
      default: true
    }
  },
  lastNotificationRead: {
    type: Date,
    default: Date.now
  },
  unreadNotificationCount: {
    type: Number,
    default: 0
  },
  
  // Mentor-related fields
  isMentor: {
    type: Boolean,
    default: false
  },
  mentorProfile: {
    expertise: [{
      type: String
    }],
    experience: {
      type: Number, // years of experience
      default: 0
    },
    bio: {
      type: String
    },
    hourlyRate: {
      type: Number
    },
    availability: {
      type: [{
        day: String,
        startTime: String,
        endTime: String
      }]
    },
    interviewTypes: [{
      type: String,
      enum: ['technical', 'behavioral', 'mock', 'resume_review', 'career_guidance', 'other']
    }]
  },
  mentorStatus: {
    type: String,
    enum: ['active', 'inactive', 'busy'],
    default: 'inactive'
  },
  
  // Coin-related fields
  hasCoinAccount: {
    type: Boolean,
    default: false
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }
}, { timestamps: true });

const User = mongoose.models.users || mongoose.model("users", UserSchema);

export default User;
