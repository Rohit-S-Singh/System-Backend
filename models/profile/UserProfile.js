import mongoose from "mongoose";

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  logo: { type: String },
  role: { type: String, required: true },
  duration: { type: String, required: true },
  location: { type: String },
  points: { type: [String], default: [] },
  current: { type: Boolean, default: false },
  teamSize: { type: Number },
  technologies: { type: [String], default: [] },
  description: { type: String }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: { type: String },
  tech: { type: [String], default: [] },
  status: { type: String, enum: ["live", "development"], default: "development" },
  featured: { type: Boolean, default: false },
  githubLink: { type: String },
  deployedLink: { type: String },
  teamSize: { type: Number },
  responsibilities: { type: [String], default: [] }
}, { _id: false });

const UserProfileSchema = new mongoose.Schema(
  {
    /** 🔑 USER ID (created at first login) */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "User"
    },

    /** 👤 USER TYPE (asked during onboarding) */
    userType: {
      type: String,
      enum: ["student", "working_professional", "None"],
      default: "None"
    },

    /** 📋 BASIC INFO */
    name: { type: String },
    email: { type: String, required: true, unique: true },
    phone: String,
    picture: String,
    coverImage: String,
    bio: String,

    /** 📊 STATS */
    stats: {
      profileViews: { type: Number, default: 0 },
      connections: { type: Number, default: 0 },
      endorsements: { type: Number, default: 0 },
      projects: { type: Number, default: 0 }
    },

    /** 💼 PROFESSIONAL DETAILS (for working_professional) */
    professionalDetails: {
      company: String,
      companyWebsite: String,
      logo: String,
      jobTitle: String,
      department: String,
      experience: String,
      currentCTC: String,
      expectedCTC: String,
      noticePeriod: String,
      careerLevel: {
        type: String,
        enum: ["intern", "entry", "mid", "senior", "lead", "executive"]
      },
      workMode: {
        type: String,
        enum: ["remote", "hybrid", "onsite"]
      },
      preferredJobRole: String,
      preferredLocations: [String]
    },

    /** 🎓 STUDENT DETAILS (for student) */
    studentDetails: {
      college: String,
      collegeWebsite: String,
      university: String,
      degree: String,
      branch: String,
      year: String,
      graduationYear: String,
      currentCGPA: String,
      tenthPercentage: String,
      twelfthPercentage: String,
      careerInterest: String,
      preferredJobRole: String,
      preferredLocations: [String]
    },

    /** 🔗 COMMON DETAILS */
    details: {
      location: String,
      skills: [String],
      github: String,
      linkedin: String,
      portfolio: String,
      leetcode: String,
      codeforces: String
    },

    /** 💼 EXPERIENCE */
    experience: [ExperienceSchema],

    /** 🚀 PROJECTS */
    projects: [ProjectSchema],

    /** 🏆 CERTIFICATIONS */
    certs: [
      {
        name: String,
        issuer: String,
        year: String,
        icon: String
      }
    ],

    /** 🌟 ACHIEVEMENTS */
    achievements: [
      {
        title: String,
        year: String,
        desc: String
      }
    ],

    /** 💬 RECOMMENDATIONS */
    recommendations: [
      {
        name: String,
        role: String,
        text: String,
        avatar: String
      }
    ]
  },
  { timestamps: true }
);

// Indexes for better query performance
UserProfileSchema.index({ userId: 1 });
UserProfileSchema.index({ email: 1 });
UserProfileSchema.index({ userType: 1 });

export default mongoose.model("UserProfile", UserProfileSchema);