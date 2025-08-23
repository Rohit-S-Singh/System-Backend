import mongoose from "mongoose";

const InterviewSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  interviewType: {
    type: String,
    enum: ['technical', 'behavioral', 'mock', 'resume_review', 'career_guidance', 'other'],
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  candidateNotes: {
    type: String
  },
  mentorNotes: {
    type: String
  },
  meetingLink: {
    type: String
  },
  calendarEventId: {
    type: String // To store Google Calendar event ID
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: String,
    enum: ['candidate', 'mentor', 'system']
  },
  cancellationReason: {
    type: String
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Indexes for efficient queries
InterviewSchema.index({ candidate: 1, status: 1, scheduledDate: 1 });
InterviewSchema.index({ mentor: 1, status: 1, scheduledDate: 1 });
InterviewSchema.index({ scheduledDate: 1, status: 1 });
InterviewSchema.index({ status: 1, requestedAt: 1 });

const Interview = mongoose.models.interviews || mongoose.model("interviews", InterviewSchema);

export default Interview; 