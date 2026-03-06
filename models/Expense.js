import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    default: "General"
  },
  note: {
    type: String
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Expense = mongoose.model("Expense", ExpenseSchema);

export default Expense;