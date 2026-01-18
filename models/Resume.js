import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true
    },

    fileName: String,
    fileUrl: String,

    fileType: {
      type: String,
      enum: ["pdf", "docx"],
    },

    fileSize: Number,

    isMain: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for faster queries
resumeSchema.index({ userId: 1, isMain: 1 });

// Ensure only one main resume per user
resumeSchema.pre('save', async function(next) {
  if (this.isMain && this.isModified('isMain')) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isMain: false } }
    );
  }
  next();
});

export default mongoose.model("resumes", resumeSchema);