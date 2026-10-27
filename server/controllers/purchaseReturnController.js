const PurchaseReturn = require('../models/PurchaseReturn');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const { adjustStock } = require('../services/stockService');
const { logActivity } = require('../services/auditService');

// @desc    Get all purchase returns
// @route   GET /api/purchase-returns
const getPurchaseReturns = async (req, res, next) => {
  try {
    const returns = await PurchaseReturn.find()
      .populate('purchase', 'purchaseNumber grandTotal')
      .populate('supplier', 'name companyName')
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

// @desc    Create purchase return
// @route   POST /api/purchase-returns
const createPurchaseReturn = async (req, res, next) => {
  try {
    const { purchaseId, supplierId, items, notes } = req.body;

    if (!purchaseId || !supplierId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'All return fields are required' });
    }

    const count = await PurchaseReturn.countDocuments();
    const returnNumber = `PR-${1000 + count + 1}`;

    let totalRefund = 0;
    const formattedItems = [];

    for (const item of items) {
      const refund = item.quantity * item.unitCost;
      totalRefund += refund;
      formattedItems.push({
        product: item.product,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitCost: item.unitCost,
        refundAmount: refund,
        reason: item.reason || 'Defective/Damaged',
      });

      // Deduct stock returned to supplier
      await adjustStock({
        productId: item.product,
        quantityChange: -Math.abs(item.quantity),
        type: 'PURCHASE_RETURN',
        unitCost: item.unitCost,
        referenceId: returnNumber,
        referenceType: 'Purchase Return',
        reason: `Returned to supplier: ${item.reason || 'Defective'}`,
        userId: req.user?.id,
      });
    }

    const pReturn = await PurchaseReturn.create({
      returnNumber,
      purchase: purchaseId,
      supplier: supplierId,
      items: formattedItems,
      totalRefund,
      status: 'completed',
      notes,
      user: req.user?.id,
    });

    // Adjust supplier balance
    const supp = await Supplier.findById(supplierId);
    if (supp) {
      supp.currentBalance = Math.max(0, (supp.currentBalance || 0) - totalRefund);
      await supp.save();
    }

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'PurchaseReturn',
      details: `Created Purchase Return ${returnNumber} for total ₹${totalRefund}`,
      req,
    });

    res.status(201).json({ success: true, data: pReturn });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchaseReturns,
  createPurchaseReturn,
};
