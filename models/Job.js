import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    /* ===============================
       🔑 IDENTITY
    =============================== */

    externalJobId: {
      type: String,
      unique: true,
      sparse: true, // allows internal jobs later
      index: true,
    },

    source: {
      type: String, // LinkedIn, Indeed, Foundit, SimplyHired, etc.
      required: true,
      index: true,
    },

    /* ===============================
       🏷 CORE JOB INFO
    =============================== */

    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    companyLogo: {
      type: String, // URL
      default: null,
    },

    companyWebsite: {
      type: String,
      default: null,
    },

    /* ===============================
       📍 LOCATION & MODE
    =============================== */

    location: {
      type: String, // "Mumbai, Maharashtra, India"
      index: true,
    },

    workMode: {
      type: String,
      enum: ["Remote", "Onsite", "Hybrid"],
      index: true,
    },

    /* ===============================
       💼 JOB TYPE
    =============================== */

    jobType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Internship", "Contract"],
      index: true,
    },

    /* ===============================
       📝 DESCRIPTION
    =============================== */

    description: {
      type: String,
    },

    /* ===============================
       🧠 SKILLS (OPTIONAL / AI LATER)
    =============================== */

    skills: [
      {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
      },
    ],

    /* ===============================
       🔗 APPLY INFO
    =============================== */

    applyLink: {
      type: String,
      required: true,
    },

    applyType: {
      type: String,
      enum: ["external", "internal"],
      default: "external",
    },

    /* ===============================
       ⏱ DATES & STATUS
    =============================== */

    postedAt: {
      type: Date,
      default: null, // many RapidAPI jobs don't have this
    },

    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  } 
);

/* ===============================
   🔍 TEXT SEARCH
=============================== */
jobSchema.index({
  title: "text",
  companyName: "text",
  location: "text",
  skills: "text",
});

export default mongoose.model("Job", jobSchema);
