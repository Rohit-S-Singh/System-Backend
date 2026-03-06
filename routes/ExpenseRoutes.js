import express from "express";

const router = express.Router();

import { 
  addExpense,
  getTodayExpenses,
  deleteExpense,
  getTodayTotal
} from "../controller/ExpenseController.js";


// Add expense (email in body)
router.post("/add-expense", addExpense);


// Get today's expenses (email via query param)
router.post("/today-expenses", getTodayExpenses);


// Get today's total spend (email via query param)
router.post("/today-total", getTodayTotal);


// Delete expense
router.delete("/delete-expense/:id", deleteExpense);


export default router;