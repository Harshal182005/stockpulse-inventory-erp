const Invoice = require('../models/Invoice');
const { sendInvoiceEmail } = require('../services/emailService');
const { logActivity } = require('../services/auditService');

// @desc    Get all invoices with search, filters, pagination
// @route   GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { search, paymentStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
      ];
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Invoice.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('sale');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Email invoice to customer
// @route   POST /api/invoices/:id/send-email
const emailInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const recipient = req.body.email || invoice.customer?.email;
    if (!recipient) {
      return res.status(400).json({ success: false, message: 'No recipient email provided' });
    }

    const emailResult = await sendInvoiceEmail(recipient, invoice);

    await logActivity({
      user: req.user,
      action: 'EXPORT',
      module: 'Invoice',
      details: `Emailed Invoice ${invoice.invoiceNumber} to ${recipient}`,
      req,
    });

    res.json({ success: true, message: `Invoice sent successfully to ${recipient}`, emailResult });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel invoice
// @route   PUT /api/invoices/:id/cancel
const cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    invoice.paymentStatus = 'cancelled';
    await invoice.save();

    await logActivity({
      user: req.user,
      action: 'STATUS_CHANGE',
      module: 'Invoice',
      details: `Cancelled Invoice ${invoice.invoiceNumber}`,
      req,
    });

    res.json({ success: true, message: 'Invoice cancelled', data: invoice });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  emailInvoice,
  cancelInvoice,
};
