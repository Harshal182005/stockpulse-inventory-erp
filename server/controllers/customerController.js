const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const { logActivity } = require('../services/auditService');

// @desc    Get all customers with search and pagination
// @route   GET /api/customers
const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: customers,
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

// @desc    Get customer by ID with sales & payments ledger
// @route   GET /api/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const sales = await Sale.find({ customer: customer._id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ customer: customer._id, type: 'customer_receipt' }).sort({ createdAt: -1 });

    const totalPurchased = sales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const totalPaid = sales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const outstanding = totalPurchased - totalPaid + (customer.openingBalance || 0);

    res.json({
      success: true,
      data: {
        customer,
        sales,
        payments,
        summary: {
          totalOrdersCount: sales.length,
          totalPurchased,
          totalPaid,
          outstandingBalance: outstanding,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create customer
// @route   POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const data = { ...req.body };
    data.currentBalance = data.openingBalance || 0;
    const customer = await Customer.create(data);

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Customer',
      details: `Created customer: ${customer.name}`,
      req,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'Customer',
      details: `Updated customer: ${customer.name}`,
      req,
    });

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    await customer.deleteOne();
    await logActivity({
      user: req.user,
      action: 'DELETE',
      module: 'Customer',
      details: `Deleted customer: ${customer.name}`,
      req,
    });

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
