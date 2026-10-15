import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      // Not required: users who sign up via Google OAuth have no password
      // until they explicitly set one (see setPasswordForOAuthUser).
    },

    phone: {
      type: Number,
    },

    // 🔐 ROLE SYSTEM (Admin support)
    role: {
      type: String,
      enum: ["user", "admin" ],
      default: "user",
    },

    // 👤 USER TYPE
    userType: {
      type: String,
      enum: ["student", "working_professional", "None"],
      default: "None",
    },

    // 🎓 Mentor & Recruiter
    mentorStatus: {
      type: String,
      enum: ["None", "pending", "approved"],
      default: "None",
    },

    recruiterStatus: {
      type: String,
      enum: ["None", "Pending", "Approved"],
      default: "None",
    },

    // 📄 Resume
    activeResume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "resumes",
      default: null,
    },

    // 🤝 CONNECTION SYSTEM
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],

    pendingConnections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],

    sentConnectionRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],

    connectionCount: {
      type: Number,
      default: 0,
    },

    // 🔗 Referral
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },

    // 🔑 Google OAuth profile (Sign-in)
    oauthProvider: { type: String },
    givenName: { type: String },
    familyName: { type: String },
    picture: { type: String },
    locale: { type: String },
    emailVerified: { type: Boolean },

    // 📧 Gmail OAuth (Connect Gmail / send-as-user)
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiry: { type: Date },

    // ✉️ Recruiter outreach templates
    htmlEmailTemplate: {
      finalHtml: { type: String },
      subject: { type: String },
    },
    followupTemplate: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { timestamps: true }
);

const User = mongoose.models.users || mongoose.model("users", UserSchema);
export default User;








