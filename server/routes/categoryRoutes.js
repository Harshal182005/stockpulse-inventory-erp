const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getCategories)
  .post(protect, authorize('admin', 'manager'), createCategory);

router
  .route('/:id')
  .put(protect, authorize('admin', 'manager'), updateCategory)
  .delete(protect, authorize('admin', 'manager'), deleteCategory);

module.exports = router;
