const express = require('express');
const router = express.Router();
const {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getBrands)
  .post(protect, authorize('admin', 'manager'), createBrand);

router
  .route('/:id')
  .put(protect, authorize('admin', 'manager'), updateBrand)
  .delete(protect, authorize('admin', 'manager'), deleteBrand);

module.exports = router;
