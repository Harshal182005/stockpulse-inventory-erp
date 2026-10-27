const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router
  .route('/')
  .get(protect, getCustomers)
  .post(protect, authorize('admin', 'manager', 'staff'), createCustomer);

router
  .route('/:id')
  .get(protect, getCustomerById)
  .put(protect, authorize('admin', 'manager', 'staff'), updateCustomer)
  .delete(protect, authorize('admin'), deleteCustomer);

module.exports = router;
