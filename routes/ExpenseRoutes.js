import express from "express";

const router = express.Router();

import { 
  addExpense,
  getTodayExpenses,
  deleteExpense,
  getTodayTotal,
  setBudget,
  getBudgetPercentage,
  getLastDayExpenses,
  getAllExpenses
} from "../controller/ExpenseController.js";


// Add expense (email in body)
router.post("/add-expense", addExpense);


// Get today's expenses (email via query param)
router.post("/today-expenses", getTodayExpenses);


// Get today's total spend (email via query param)
router.post("/today-total", getTodayTotal);


// Delete expense
router.delete("/delete-expense/:id", deleteExpense);



// set monthly budget
router.post("/set-budget", setBudget);

// get percentage spent
router.get("/budget-percentage", getBudgetPercentage);

// get yesterday expenses
router.get("/expenses-last-day", getLastDayExpenses);

// get all expenses
router.get("/expenses", getAllExpenses);


export default router;