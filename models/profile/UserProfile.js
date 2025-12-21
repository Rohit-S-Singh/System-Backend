import mongoose from "mongoose";

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  logo: { type: String }, // optional company logo
  role: { type: String, required: true },
  duration: { type: String, required: true },
  location: { type: String },
  points: { type: [String], default: [] }, // achievements or responsibilities
  current: { type: Boolean, default: false },
  teamSize: { type: Number }, // number of team members
  technologies: { type: [String], default: [] }, // tech stack used
  description: { type: String } // detailed description
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: { type: String }, // description of project
  tech: { type: [String], default: [] }, // technologies used
  status: { type: String, enum: ["live", "development"], default: "development" },
  featured: { type: Boolean, default: false },
  githubLink: { type: String }, // optional GitHub link
  deployedLink: { type: String }, // optional live/deployed link
  teamSize: { type: Number }, // number of contributors
  responsibilities: { type: [String], default: [] } // what user did in the project
}, { _id: false });




const UserProfileSchema = new mongoose.Schema(
  {
    /** 🔑 USER ID (created at first login) */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "User" // Auth/User collection
    },

    /** 👤 USER TYPE (asked during onboarding) */
    userType: {
      type: String,
      enum: ["student", "working_professional"],
      required: true
    },

    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    picture: String,
    coverImage: String,
    bio: String,

    stats: {
      profileViews: { type: Number, default: 0 },
      connections: { type: Number, default: 0 },
      endorsements: { type: Number, default: 0 },
      projects: { type: Number, default: 0 }
    },

    details: {
      company: String,
      logo: String,
      title: String,
      experience: String,
      location: String,
      ctc: String,
      expectedCTC: String,
      notice: String,
      workMode: {
        type: String,
        enum: ["Remote", "Hybrid", "Onsite", ""]
      },
      skills: [String],
      github: String,
      linkedin: String,
      portfolio: String
    },

    experience: [ExperienceSchema],
    projects: [ProjectSchema],

    certs: [
      {
        name: String,
        issuer: String,
        year: String,
        icon: String
      }
    ],

    achievements: [
      {
        title: String,
        year: String,
        desc: String
      }
    ],

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

export default mongoose.model("UserProfile", UserProfileSchema);
