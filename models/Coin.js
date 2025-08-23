import mongoose from "mongoose";

const CoinTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  type: {
    type: String,
    enum: [
      'earned',
      'redeemed',
      'bonus',
      'referral',
      'interview_completed',
      'subscription_purchase',
      'refund',
      'expired'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    type: String // Reference to related entity (interview ID, referral ID, etc.)
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date // For coins that expire
  },
  isExpired: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

const CoinSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalRedeemed: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  referralCount: {
    type: Number,
    default: 0
  },
  referralEarnings: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Indexes for efficient queries
CoinSchema.index({ user: 1 });
CoinSchema.index({ referralCode: 1 });
CoinSchema.index({ referredBy: 1 });

const Coin = mongoose.models.coins || mongoose.model("coins", CoinSchema);
const CoinTransaction = mongoose.models.coin_transactions || mongoose.model("coin_transactions", CoinTransactionSchema);

export { Coin, CoinTransaction }; 