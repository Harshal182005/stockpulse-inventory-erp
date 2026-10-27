const express = require('express');
const router = express.Router();
const {
  getInventorySummary,
  adjustProductStock,
  transferStock,
  getStockMovements,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/summary', protect, getInventorySummary);
router.post('/adjust', protect, authorize('admin', 'manager', 'staff'), adjustProductStock);
router.post('/transfer', protect, authorize('admin', 'manager'), transferStock);
router.get('/movements', protect, getStockMovements);

module.exports = router;
