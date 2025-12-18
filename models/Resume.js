import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      // ❌ removed `unique: true` to allow multiple resumes per user
    },

    // 🔹 Resume type (Phase 1 + Phase 2)
    type: {
      type: String,
      enum: ["auto-generated", "uploaded"],
      required: true,
      default: "auto-generated",
    },

    // 🔹 Original uploaded file info (Phase 2)
    originalFile: {
      url: {
        type: String,
      },
      fileType: {
        type: String, // "pdf" | "docx"
      },
      uploadedAt: {
        type: Date,
      },
    },

    // 🔹 Structured resume content (same for all types)
    content: {
      header: {
        name: String,
        email: String,
        phone: String,
        location: String,
        linkedin: String,
        github: String,
      },

      summary: String,

      experience: [
        {
          company: String,
          role: String,
          location: String,
          startDate: String,
          endDate: String,
          bullets: [String],
        },
      ],

      projects: [
        {
          title: String,
          techStack: [String],
          bullets: [String],
        },
      ],

      skills: {
        languages: [String],
        frameworks: [String],
        databases: [String],
        tools: [String],
      },

      education: [
        {
          degree: String,
          branch: String,
          college: String,
          year: String,
        },
      ],

      certifications: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model("resumes", ResumeSchema);
