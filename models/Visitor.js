import mongoose from "mongoose";

const VisitorSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null, // guest visitors
    },

    visitedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

VisitorSchema.index({ ip: 1, userAgent: 1, visitedAt: 1 });

export default mongoose.model("visitors", VisitorSchema);
