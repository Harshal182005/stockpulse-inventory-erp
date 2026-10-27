const express = require('express');
const router = express.Router();
const {
  getPurchaseReturns,
  createPurchaseReturn,
} = require('../controllers/purchaseReturnController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getPurchaseReturns)
  .post(protect, authorize('admin', 'manager'), createPurchaseReturn);

module.exports = router;
