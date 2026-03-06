import Expense from "../models/Expense.js";

// Add Expense
export const addExpense = async (req, res) => {
  try {

    const { email, amount, category, note } = req.body;

    const expense = new Expense({
      email,
      amount,
      category,
      note
    });

    await expense.save();

    res.status(201).json({
      success: true,
      data: expense
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



// Delete Expense
export const deleteExpense = async (req, res) => {
  try {

    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    res.json({
      success: true,
      message: "Expense deleted successfully",
      data: expense
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



// Get Today's Expenses (EMAIL WISE)
export const getTodayExpenses = async (req, res) => {
  try {

    const { email } = req.query;

    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    const expenses = await Expense.find({
      email,
      createdAt: {
        $gte: start,
        $lte: end
      }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: expenses.length,
      data: expenses
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



// Get Today's Total (EMAIL WISE)
export const getTodayTotal = async (req, res) => {
  try {

    const { email } = req.query;

    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    const result = await Expense.aggregate([
      {
        $match: {
          email,
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" }
        }
      }
    ]);

    const total = result.length > 0 ? result[0].totalSpent : 0;

    res.json({
      success: true,
      totalSpent: total
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};