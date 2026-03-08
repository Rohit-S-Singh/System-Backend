import mongoose from "mongoose";

/* Coin Schema */
const CoinSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  balance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  totalRedeemed: { type: Number, default: 0 },
  referralCode: String,
  referralCount: { type: Number, default: 0 },
  referralEarnings: { type: Number, default: 0 },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  lastActivity: Date
}, { timestamps: true });

/* CoinTransaction Schema */
const CoinTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  type: {
    type: String,
    enum: [
      "earned",
      "redeemed",
      "bonus",
      "referral",
      "interview_completed",
      "subscription_purchase",
      "refund",
      "expired"
    ],
    required: true
  },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  description: { type: String, required: true },
  interview: { type: mongoose.Schema.Types.ObjectId, ref: "interviews" },
  role: { type: String, enum: ["mentor", "candidate", "system"], default: "system" },
  status: { type: String, default: "completed" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

/* EXPORTS (THIS IS REQUIRED) */
export const Coin = mongoose.model("coins", CoinSchema);
export const CoinTransaction = mongoose.model("coin_transactions", CoinTransactionSchema);
