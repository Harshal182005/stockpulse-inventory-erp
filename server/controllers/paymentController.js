const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');
const { logActivity } = require('../services/auditService');

// @desc    Get all payments
// @route   GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { search, type, paymentMethod, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { paymentNumber: { $regex: search, $options: 'i' } },
        { partyName: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) query.type = type;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('customer', 'name phone')
        .populate('supplier', 'name companyName')
        .populate('user', 'name')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: payments,
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

// @desc    Create new payment record
// @route   POST /api/payments
const createPayment = async (req, res, next) => {
  try {
    const {
      type, // 'customer_receipt' or 'supplier_payment'
      customerId,
      supplierId,
      partyName,
      amount,
      paymentMethod = 'cash',
      referenceNumber = '',
      notes = '',
      invoiceId,
      purchaseId,
    } = req.body;

    if (!type || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid type and amount are required' });
    }

    const count = await Payment.countDocuments();
    const prefix = type === 'customer_receipt' ? 'REC' : 'PAY';
    const paymentNumber = `${prefix}-${1000 + count + 1}`;

    const numAmount = Number(amount);

    const payment = await Payment.create({
      paymentNumber,
      type,
      customer: customerId || undefined,
      supplier: supplierId || undefined,
      partyName,
      amount: numAmount,
      paymentMethod,
      referenceNumber,
      notes,
      sale: invoiceId ? undefined : undefined,
      purchase: purchaseId || undefined,
      user: req.user?.id,
    });

    // Update customer / supplier balance
    if (type === 'customer_receipt' && customerId) {
      const cust = await Customer.findById(customerId);
      if (cust) {
        cust.currentBalance = Math.max(0, (cust.currentBalance || 0) - numAmount);
        await cust.save();
      }
    } else if (type === 'supplier_payment' && supplierId) {
      const supp = await Supplier.findById(supplierId);
      if (supp) {
        supp.currentBalance = Math.max(0, (supp.currentBalance || 0) - numAmount);
        await supp.save();
      }
    }

    // If linked to an invoice, update invoice paid amount & status
    if (invoiceId) {
      const inv = await Invoice.findById(invoiceId);
      if (inv) {
        inv.paidAmount = (inv.paidAmount || 0) + numAmount;
        inv.dueAmount = Math.max(0, inv.grandTotal - inv.paidAmount);
        inv.paymentStatus = inv.dueAmount === 0 ? 'paid' : 'partial';
        await inv.save();
      }
    }

    // If linked to a purchase, update purchase paid amount & status
    if (purchaseId) {
      const purch = await Purchase.findById(purchaseId);
      if (purch) {
        purch.paidAmount = (purch.paidAmount || 0) + numAmount;
        purch.paymentStatus = purch.paidAmount >= purch.grandTotal ? 'paid' : 'partial';
        await purch.save();
      }
    }

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Payment',
      details: `Recorded payment ${paymentNumber} of ₹${numAmount} (${type})`,
      req,
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment summary stats
// @route   GET /api/payments/stats
const getPaymentStats = async (req, res, next) => {
  try {
    const receipts = await Payment.aggregate([
      { $match: { type: 'customer_receipt' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const payouts = await Payment.aggregate([
      { $match: { type: 'supplier_payment' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalReceipts = receipts[0]?.total || 0;
    const totalPayouts = payouts[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalReceipts,
        totalPayouts,
        netCashflow: totalReceipts - totalPayouts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  createPayment,
  getPaymentStats,
};
