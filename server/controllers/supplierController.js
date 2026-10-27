const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const { logActivity } = require('../services/auditService');

// @desc    Get all suppliers with search and pagination
// @route   GET /api/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort({ companyName: 1 }).skip(skip).limit(Number(limit)),
      Supplier.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: suppliers,
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

// @desc    Get supplier by ID with purchases & payments ledger
// @route   GET /api/suppliers/:id
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    const purchases = await Purchase.find({ supplier: supplier._id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ supplier: supplier._id, type: 'supplier_payment' }).sort({ createdAt: -1 });

    const totalPurchased = purchases.reduce((acc, p) => acc + (p.grandTotal || 0), 0);
    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const outstanding = totalPurchased - totalPaid + (supplier.openingBalance || 0);

    res.json({
      success: true,
      data: {
        supplier,
        purchases,
        payments,
        summary: {
          totalPurchasesCount: purchases.length,
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

// @desc    Create supplier
// @route   POST /api/suppliers
const createSupplier = async (req, res, next) => {
  try {
    const data = { ...req.body };
    data.currentBalance = data.openingBalance || 0;
    const supplier = await Supplier.create(data);

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Supplier',
      details: `Created supplier: ${supplier.companyName} (${supplier.name})`,
      req,
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'Supplier',
      details: `Updated supplier: ${supplier.companyName}`,
      req,
    });

    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    await supplier.deleteOne();
    await logActivity({
      user: req.user,
      action: 'DELETE',
      module: 'Supplier',
      details: `Deleted supplier: ${supplier.companyName}`,
      req,
    });

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
