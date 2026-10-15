import mongoose from "mongoose";

import { Schema } from  "mongoose";

const interviewResultSchema = new Schema({
  // 1. Metadata & Identifiers
  candidateId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Indexed for quick dashboard retrieval
  },
  targetRole: { 
    type: String, 
    required: true 
  },
  interviewerPersona: { 
    type: String, 
    default: 'Bhavya' 
  },
  durationMinutes: { 
    type: Number, 
    required: true 
  },
  completedAt: { 
    type: Date, 
    default: Date.now 
  },

  // 2. Executive Summary
  executiveSummary: {
    recommendation: {
      type: String,
      enum: ['Strong Hire', 'Hire', 'Borderline', 'No Hire'],
      required: true
    },
    overallScore: { type: Number, min: 0, max: 100, required: true },
    assessedSeniority: { type: String }, // e.g., "Mid-Level", "Senior"
    topStrengths: [{ type: String }],
    criticalFocusAreas: [{ type: String }]
  },

  // 3. Communication Metrics
  communicationMetrics: {
    speakingPaceWpm: { type: Number },
    fillerWordsCount: { type: Number },
    longestPauseSeconds: { type: Number },
    confidenceScore: { type: Number, min: 0, max: 100 }
  },

  // 4. Domain Expertise Breakdown
  // Stored as an array so it dynamically adapts to any job role
  domainExpertise: [{
    topic: { type: String, required: true }, // e.g., "Backend Architecture (Express/Node)"
    score: { type: Number, min: 0, max: 100, required: true }
  }],

  // 5. Behavioral Analysis (STAR Framework)
  // Array allows for multiple behavioral questions in a single interview
  behavioralAnalysis: [{
    questionFocus: { type: String, required: true },
    situation: {
      assessment: { type: String }, // AI's text feedback
      passed: { type: Boolean }     // True/False for the visual tag
    },
    task: {
      assessment: { type: String },
      passed: { type: Boolean }
    },
    action: {
      assessment: { type: String },
      passed: { type: Boolean }
    },
    result: {
      assessment: { type: String },
      passed: { type: Boolean }
    }
  }],

  // 6. Action Plan & Next Steps
  actionPlan: [{
    moduleName: { type: String, required: true }, // Internal platform link/module
    description: { type: String, required: true }
  }]
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

// Create a compound index to quickly find a user's progress in a specific role over time
interviewResultSchema.index({ candidateId: 1, targetRole: 1, completedAt: -1 });

export default mongoose.model('InterviewResult', interviewResultSchema);