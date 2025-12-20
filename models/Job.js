import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    /* ===============================
       👤 WHO POSTED THE JOB
       mentor | recruiter | admin | autofetch
    =============================== */

    postedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null, // ✅ null ONLY for autofetch jobs
      },

      role: {
        type: String,
        enum: ["mentor", "recruiter", "admin"],
        default: null, // ✅ null for autofetch
        index: true,
      },

      name: {
        type: String, // snapshot at posting time
        default: null,
      },
    },

    /* ===============================
       🌐 SOURCE INFORMATION
    =============================== */

    source: {
      type: String, 
      enum: [
        "LinkedIn",
        "Naukri",
        "Unstop",
        "Company Career Page",
        "Mentor",
        "Recruiter",
        "Admin",
        "AutoFetch",
      ],
      required: true,
      index: true,
    },

    externalJobId: {
      type: String,
      unique: true,
      sparse: true, // ✅ allows multiple nulls
      index: true,
    },

    /* ===============================
       🏷 BASIC JOB INFO
    =============================== */

    title: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    companyLogo: {
      type: String,
    },

    category: {
      type: String, // Tech, Sales, Marketing, HR, Finance
      index: true,
    },

    jobType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Internship", "Contract"],
      index: true,
    },

    workMode: {
      type: String,
      enum: ["Remote", "Onsite", "Hybrid"],
      index: true,
    },

    location: {
      type: String,
      index: true,
    },

    experienceLevel: {
      type: String, // Fresher, 0-1, 1-3, 3-5, 5+
      index: true,
    },

    /* ===============================
       📄 JOB DETAILS (OPTIONAL)
    =============================== */

    description: {
      type: String,
    },

    responsibilities: [
      {
        type: String,
      },
    ],

    /* ===============================
       🧠 SKILLS (SEARCH + MATCHING)
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
       🎓 ELIGIBILITY (OPTIONAL)
    =============================== */

    eligibility: {
      batch: [{ type: Number }],
      minCGPA: {
        type: Number,
        min: 0,
        max: 10,
      },
      branchesAllowed: [{ type: String }],
    },

    /* ===============================
       💰 SALARY / STIPEND
    =============================== */

    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: {
        type: String,
        default: "INR",
      },
      period: {
        type: String,
        enum: ["Per Annum", "Per Month"],
        default: "Per Annum",
      },
    },

    /* ===============================
       🔗 APPLY & DEADLINE
    =============================== */

    applyLink: {
      type: String,
    },

    applicationDeadline: {
      type: Date,
      index: true,
    },

    /* ===============================
       📊 STATUS & MODERATION
    =============================== */

    status: {
      type: String,
      enum: ["Open", "Closed", "Paused"],
      default: "Open",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false, 
      // mentor/recruiter jobs → false
      // admin jobs → true (auto)
    },

    /* ===============================
       📈 ANALYTICS
    =============================== */

    applicantsCount: {
      type: Number,
      default: 0,
    },

    clicks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* ===============================
   🔍 TEXT SEARCH
=============================== */

jobSchema.index({
  title: "text",
  companyName: "text",
  skills: "text",
  location: "text",
  category: "text",
});

export default mongoose.model("Job", jobSchema);
