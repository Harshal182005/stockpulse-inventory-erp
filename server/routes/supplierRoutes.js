const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getSuppliers)
  .post(protect, authorize('admin', 'manager'), createSupplier);

router
  .route('/:id')
  .get(protect, getSupplierById)
  .put(protect, authorize('admin', 'manager'), updateSupplier)
  .delete(protect, authorize('admin'), deleteSupplier);

module.exports = router;
