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

  

  mentorStatus: {
    type: String,
    enum: ['Pending', 'You Are A Mentor', 'Become a Mentor'],
    default: 'Become a Mentor'
  },
  
  isRecruiter: {
  type: Boolean,
  default: false
},

recruiterProfile: {
  companyName: String,
  position: String,
  experienceYears: String,
  website: String
},
recruiterStatus: {
  type: String,
  enum: ['Pending', 'You Are A Recruiter', 'Become a Recruiter'],
  default: 'Become a Recruiter'
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
  // ----------------------------------------------------
  // 🆕 USER CATEGORY SYSTEM (Student / Professional)
  // ----------------------------------------------------
  userType: {
    type: String,
    enum: ["student", "professional", null],
    default: null,
  },
activeResume: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "resumes",
  default: null
},

  // ------------------ STUDENT DETAILS ------------------
  studentDetails: {
    college: { type: String },
    collegeWebsite: { type: String },
    university: { type: String },
    degree: { type: String },
    branch: { type: String },
    year: { type: String },
    graduationYear: { type: String },

    currentCGPA: { type: String },
    tenthPercentage: { type: String },
    twelfthPercentage: { type: String },

    skills: { type: [String] },

    resumeLink: { type: String },
    portfolioLink: { type: String },
    github: { type: String },
    leetcode: { type: String },
    codeforces: { type: String },

    careerInterest: { type: String },         // e.g., Software, Data Science, Core Engineering
    preferredJobRole: { type: String },       // e.g., MERN Developer
    preferredLocations: { type: [String] },   // e.g., ["Bangalore", "Hyderabad"]
  },

  // ---------------- PROFESSIONAL DETAILS ----------------
  professionalDetails: {
    company: { type: String },
    companyWebsite: { type: String },

    jobTitle: { type: String },
    department: { type: String }, // e.g., Engineering / Marketing
    experience: { type: String }, // e.g., "2 years"

    currentCTC: { type: String },
    expectedCTC: { type: String },
    noticePeriod: { type: String }, // e.g., "30 days"

    skills: { type: [String] },

    resumeLink: { type: String },
    portfolioLink: { type: String },
    github: { type: String },
    linkedin: { type: String },

careerLevel: {
  type: String,
  enum: ["intern", "entry", "mid", "senior", "lead", "executive"]
},
workMode: { type: String, enum: ["remote", "hybrid", "onsite"] },

    preferredJobRole: { type: String },
    preferredLocations: { type: [String] },
  },



  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }
}, { timestamps: true });

const User = mongoose.models.users || mongoose.model("users", UserSchema);

export default User;
