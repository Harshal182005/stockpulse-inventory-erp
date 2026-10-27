const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  emailInvoice,
  cancelInvoice,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/:id/send-email', protect, emailInvoice);
router.put('/:id/cancel', protect, authorize('admin', 'accountant'), cancelInvoice);

module.exports = router;
