const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  receivePurchase,
} = require('../controllers/purchaseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getPurchases)
  .post(protect, authorize('admin', 'manager'), createPurchase);

router.get('/:id', protect, getPurchaseById);
router.put('/:id/receive', protect, authorize('admin', 'manager'), receivePurchase);

module.exports = router;
