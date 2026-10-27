const SalesReturn = require('../models/SalesReturn');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const { adjustStock } = require('../services/stockService');
const { logActivity } = require('../services/auditService');

// @desc    Get all sales returns
// @route   GET /api/sales-returns
const getSalesReturns = async (req, res, next) => {
  try {
    const returns = await SalesReturn.find()
      .populate('sale', 'invoiceNumber grandTotal')
      .populate('customer', 'name phone')
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

// @desc    Create sales return
// @route   POST /api/sales-returns
const createSalesReturn = async (req, res, next) => {
  try {
    const { saleId, items, notes } = req.body;

    if (!saleId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale and items are required' });
    }

    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

    const count = await SalesReturn.countDocuments();
    const returnNumber = `SR-${1000 + count + 1}`;

    let totalRefund = 0;
    const formattedItems = [];

    for (const item of items) {
      const refund = item.quantity * item.unitPrice;
      totalRefund += refund;
      formattedItems.push({
        product: item.product,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        refundAmount: refund,
        reason: item.reason || 'Defective/Customer changed mind',
      });

      // Increase stock as product is returned back to inventory
      await adjustStock({
        productId: item.product,
        quantityChange: item.quantity,
        type: 'SALES_RETURN',
        unitCost: item.unitPrice,
        referenceId: returnNumber,
        referenceType: 'Sales Return',
        reason: `Customer return for ${sale.invoiceNumber}: ${item.reason || 'Defective'}`,
        userId: req.user?.id,
      });
    }

    const sReturn = await SalesReturn.create({
      returnNumber,
      sale: saleId,
      customer: sale.customer,
      customerName: sale.customerName,
      items: formattedItems,
      totalRefund,
      status: 'completed',
      notes,
      user: req.user?.id,
    });

    // Update customer outstanding balance if applicable
    if (sale.customer) {
      const cust = await Customer.findById(sale.customer);
      if (cust) {
        cust.currentBalance = Math.max(0, (cust.currentBalance || 0) - totalRefund);
        await cust.save();
      }
    }

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'SalesReturn',
      details: `Created Sales Return ${returnNumber} for Invoice ${sale.invoiceNumber} (Refund: ₹${totalRefund})`,
      req,
    });

    res.status(201).json({ success: true, data: sReturn });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReturns,
  createSalesReturn,
};
