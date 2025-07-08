// models/Recruiter.js
import mongoose from 'mongoose';

const recruiterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: false },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'No Response' },
  sentAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Recruiter', recruiterSchema);
