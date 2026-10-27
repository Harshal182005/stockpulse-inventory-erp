const express = require('express');
const router = express.Router();
const {
  getSales,
  getSaleById,
  createSale,
} = require('../controllers/saleController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getSales)
  .post(protect, authorize('admin', 'manager', 'staff'), createSale);

router.get('/:id', protect, getSaleById);

module.exports = router;
