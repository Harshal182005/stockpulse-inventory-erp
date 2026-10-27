const Expense = require('../models/Expense');
const { logActivity } = require('../services/auditService');

// @desc    Get all expenses with search, category, and pagination
// @route   GET /api/expenses
const getExpenses = async (req, res, next) => {
  try {
    const { search, category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { expenseNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(query).populate('user', 'name').sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Expense.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const { title, category, amount, date, paymentMethod, description, receiptUrl } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ success: false, message: 'Title and amount are required' });
    }

    const count = await Expense.countDocuments();
    const expenseNumber = `EXP-${1000 + count + 1}`;

    const expense = await Expense.create({
      expenseNumber,
      title,
      category: category || 'Other',
      amount: Number(amount),
      date: date || Date.now(),
      paymentMethod: paymentMethod || 'cash',
      description,
      receiptUrl,
      user: req.user?.id,
    });

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Expense',
      details: `Created expense: ${expense.title} (₹${expense.amount}) in category ${expense.category}`,
      req,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'Expense',
      details: `Updated expense: ${expense.title}`,
      req,
    });

    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    await expense.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE',
      module: 'Expense',
      details: `Deleted expense: ${expense.title}`,
      req,
    });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense summary category-wise
// @route   GET /api/expenses/summary
const getExpenseSummary = async (req, res, next) => {
  try {
    const categoryBreakdown = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const totalExpense = categoryBreakdown.reduce((acc, c) => acc + c.total, 0);

    res.json({
      success: true,
      data: {
        totalExpense,
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
};
