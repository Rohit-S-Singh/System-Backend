import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },

  paypalOrderId: {
    type: String,
    required: true,
  },

  amount: Number,
  currency: { type: String, default: "USD" },

  purpose: String, // "Premium Plan", "Mentor Session", etc.

  status: {
    type: String,
    enum: ["CREATED", "COMPLETED", "FAILED"],
    default: "CREATED",
  },

}, { timestamps: true });

export default mongoose.model("payments", paymentSchema);
