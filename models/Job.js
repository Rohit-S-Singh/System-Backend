import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    /* ===============================
       🔑 IDENTITY
    =============================== */
    externalJobId: {
      type: String, // job_id
      required: true,
      unique: true,
      index: true,
    },

    source: {
      type: String, // jsearch
      required: true,
      index: true,
    },

    publisher: {
      type: String, // job_publisher
      default: null,
      index: true,
    },

    /* ===============================
       🏷 CORE INFO
    =============================== */
    title: {
      type: String, // job_title
      required: true,
      trim: true,
      index: true,
    },

    companyName: {
      type: String, // employer_name
      required: true,
      trim: true,
      index: true,
    },

    companyLogo: {
      type: String, // employer_logo
      default: null,
    },

    companyWebsite: {
      type: String, // employer_website
      default: null,
    },

    /* ===============================
       📍 LOCATION
    =============================== */
    location: {
      type: String, // job_location
      index: true,
    },

    city: {
      type: String,
      default: null,
      index: true,
    },

    state: {
      type: String,
      default: null,
      index: true,
    },

    country: {
      type: String,
      default: null,
      index: true,
    },

    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    /* ===============================
       💼 JOB TYPE & MODE
    =============================== */
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

    /* ===============================
       📝 DESCRIPTION
    =============================== */
    description: {
      type: String,
    },

    /* ===============================
       💰 SALARY (OPTIONAL)
    =============================== */
    salary: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      period: { type: String, default: null }, // MONTH / YEAR
    },

    /* ===============================
       🎁 BENEFITS
    =============================== */
    benefits: {
      type: [String],
      default: [],
    },

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
      default: null,
      index: true,
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
  { timestamps: true }
);

/* ===============================
   🔍 SEARCH INDEX
=============================== */
jobSchema.index({
  title: "text",
  companyName: "text",
  location: "text",
  description: "text",
});

export default mongoose.model("Job", jobSchema);
