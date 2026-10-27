const express = require('express');
const router = express.Router();
const {
  getSalesReturns,
  createSalesReturn,
} = require('../controllers/salesReturnController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getSalesReturns)
  .post(protect, authorize('admin', 'manager', 'staff'), createSalesReturn);

module.exports = router;
