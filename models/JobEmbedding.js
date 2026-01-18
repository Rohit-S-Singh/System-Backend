import mongoose from "mongoose";

const JobEmbeddingSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "jobs",
      required: true,
      unique: true
    },

    company: String,
    title: String,

    embedding: {
      type: [Number],
      required: true
    },

    jobText: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("job_embeddings", JobEmbeddingSchema);
