import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'pro', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired'],
    default: 'active'
  },
  paymentMethod: {
    type: String,
    enum: ['coins', 'credit_card', 'paypal', 'bank_transfer'],
    required: true
  },
  coinsUsed: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  features: [{
    type: String
  }],
  autoRenew: {
    type: Boolean,
    default: false
  },
  transactionId: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true 
});

// Indexes
SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 });

const Subscription = mongoose.models.subscriptions || mongoose.model("subscriptions", SubscriptionSchema);

export default Subscription; 