import mongoose from "mongoose";

const ResumeEmbeddingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true
    },

    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "resumes",
      required: true,
      unique: true
    },

    embedding: {
      type: [Number],
      required: true
    },

    previewText: {
      type: String
    }

  },
  { timestamps: true }
);

export default mongoose.model("resume_embeddings", ResumeEmbeddingSchema);
