const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/summary', protect, getExpenseSummary);

router
  .route('/')
  .get(protect, getExpenses)
  .post(protect, authorize('admin', 'accountant', 'manager'), createExpense);

router
  .route('/:id')
  .put(protect, authorize('admin', 'accountant'), updateExpense)
  .delete(protect, authorize('admin', 'accountant'), deleteExpense);

module.exports = router;
