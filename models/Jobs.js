// models/Job.js
import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String },
    jobType: { type: String },
    openings: { type: Number, default: 1 },
    category: { type: String },
    link: { type: String, required: true },
    referralInstructions: { type: String },
  },
  { timestamps: true }
);

const Job = mongoose.model('Jobs', JobSchema);

export default Job;
