const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPayment,
  getPaymentStats,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/stats', protect, getPaymentStats);

router
  .route('/')
  .get(protect, getPayments)
  .post(protect, authorize('admin', 'accountant', 'manager'), createPayment);

module.exports = router;
