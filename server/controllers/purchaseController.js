const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Payment = require('../models/Payment');
const { adjustStock } = require('../services/stockService');
const { logActivity } = require('../services/auditService');

// @desc    Get all purchases
// @route   GET /api/purchases
const getPurchases = async (req, res, next) => {
  try {
    const { search, status, supplier, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.purchaseNumber = { $regex: search, $options: 'i' };
    }
    if (status) query.orderStatus = status;
    if (supplier) query.supplier = supplier;

    const skip = (Number(page) - 1) * Number(limit);
    const [purchases, total] = await Promise.all([
      Purchase.find(query)
        .populate('supplier', 'name companyName phone')
        .populate('warehouse', 'name code')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Purchase.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: purchases,
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

// @desc    Get purchase by ID
// @route   GET /api/purchases/:id
const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier')
      .populate('warehouse')
      .populate('user', 'name email');

    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    res.json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

// @desc    Create purchase order / invoice
// @route   POST /api/purchases
const createPurchase = async (req, res, next) => {
  try {
    const { supplier, warehouse, items, shippingCost = 0, paymentStatus = 'pending', paidAmount = 0, orderStatus = 'ordered', notes } = req.body;

    if (!supplier || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier and items are required' });
    }

    // Auto-generate Purchase Number
    const count = await Purchase.countDocuments();
    const purchaseNumber = `PO-${1000 + count + 1}`;

    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const formattedItems = [];
    for (const item of items) {
      const prod = await Product.findById(item.product);
      if (!prod) throw new Error(`Product ${item.product} not found`);

      const qty = Number(item.quantity);
      const cost = Number(item.unitCost || prod.purchasePrice);
      const taxRate = Number(item.taxRate || prod.taxRate || 0);
      const discount = Number(item.discount || 0);

      const itemBase = qty * cost;
      const itemDiscount = (itemBase * discount) / 100;
      const taxable = itemBase - itemDiscount;
      const itemTax = (taxable * taxRate) / 100;
      const itemSubtotal = taxable + itemTax;

      subtotal += itemBase;
      discountTotal += itemDiscount;
      taxTotal += itemTax;

      formattedItems.push({
        product: prod._id,
        productName: prod.name,
        sku: prod.sku,
        quantity: qty,
        unitCost: cost,
        taxRate,
        discount,
        subtotal: itemSubtotal,
      });
    }

    const grandTotal = subtotal - discountTotal + taxTotal + Number(shippingCost);

    const purchase = await Purchase.create({
      purchaseNumber,
      supplier,
      warehouse,
      items: formattedItems,
      subtotal,
      discountTotal,
      taxTotal,
      shippingCost,
      grandTotal,
      paidAmount,
      paymentStatus: paidAmount >= grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
      orderStatus,
      notes,
      user: req.user?.id,
    });

    // If orderStatus is 'received' or 'completed', automatically update stock
    if (orderStatus === 'received' || orderStatus === 'completed') {
      for (const item of formattedItems) {
        await adjustStock({
          productId: item.product,
          quantityChange: item.quantity,
          type: 'PURCHASE',
          warehouseId: warehouse,
          unitCost: item.unitCost,
          referenceId: purchaseNumber,
          referenceType: 'Purchase Order',
          reason: `Goods Received for PO ${purchaseNumber}`,
          userId: req.user?.id,
        });
      }
    }

    // If payment was made, record payment entry
    if (paidAmount > 0) {
      const payCount = await Payment.countDocuments();
      await Payment.create({
        paymentNumber: `PAY-${1000 + payCount + 1}`,
        type: 'supplier_payment',
        purchase: purchase._id,
        supplier,
        amount: paidAmount,
        paymentMethod: 'bank_transfer',
        referenceNumber: purchaseNumber,
        notes: `Initial payment on ${purchaseNumber}`,
        user: req.user?.id,
      });
    }

    // Update supplier current balance
    const supp = await Supplier.findById(supplier);
    if (supp) {
      supp.currentBalance = (supp.currentBalance || 0) + (grandTotal - paidAmount);
      await supp.save();
    }

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Purchase',
      details: `Created Purchase Order ${purchaseNumber} for total ₹${grandTotal}`,
      newValues: purchase,
      req,
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

// @desc    Receive purchase order (update inventory)
// @route   PUT /api/purchases/:id/receive
const receivePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    if (purchase.orderStatus === 'received' || purchase.orderStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Purchase order is already marked as received' });
    }

    // Update stock for all items
    for (const item of purchase.items) {
      await adjustStock({
        productId: item.product,
        quantityChange: item.quantity,
        type: 'PURCHASE',
        warehouseId: purchase.warehouse,
        unitCost: item.unitCost,
        referenceId: purchase.purchaseNumber,
        referenceType: 'Purchase Order',
        reason: `Goods Received for PO ${purchase.purchaseNumber}`,
        userId: req.user?.id,
      });
    }

    purchase.orderStatus = 'received';
    await purchase.save();

    await logActivity({
      user: req.user,
      action: 'STATUS_CHANGE',
      module: 'Purchase',
      details: `Marked Purchase ${purchase.purchaseNumber} as RECEIVED and updated inventory stock`,
      req,
    });

    res.json({ success: true, message: 'Purchase items received and inventory updated', data: purchase });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  receivePurchase,
};
