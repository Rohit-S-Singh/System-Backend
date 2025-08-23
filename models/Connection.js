import mongoose from "mongoose";

const ConnectionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  }
}, { 
  timestamps: true,
  // Ensure unique connections between users
  indexes: [
    { 
      unique: true, 
      fields: { sender: 1, receiver: 1 } 
    }
  ]
});

// Prevent duplicate connections
ConnectionSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const Connection = mongoose.models.connections || mongoose.model("connections", ConnectionSchema);

export default Connection; 