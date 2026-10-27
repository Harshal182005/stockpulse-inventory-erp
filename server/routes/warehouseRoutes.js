const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  getWarehouseInventory,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} = require('../controllers/warehouseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getWarehouses)
  .post(protect, authorize('admin', 'manager'), createWarehouse);

router.get('/:id/inventory', protect, getWarehouseInventory);

router
  .route('/:id')
  .put(protect, authorize('admin', 'manager'), updateWarehouse)
  .delete(protect, authorize('admin'), deleteWarehouse);

module.exports = router;
