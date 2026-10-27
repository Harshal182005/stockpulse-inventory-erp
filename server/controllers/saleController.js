const Sale = require('../models/Sale');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const { adjustStock } = require('../services/stockService');
const { logActivity } = require('../services/auditService');

// @desc    Get all sales with search, status, and pagination
// @route   GET /api/sales
const getSales = async (req, res, next) => {
  try {
    const { search, paymentStatus, saleStatus, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (saleStatus) query.saleStatus = saleStatus;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('customer', 'name phone email')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Sale.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: sales,
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

// @desc    Get sale by ID
// @route   GET /api/sales/:id
const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate('items.product')
      .populate('user', 'name email');

    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

// @desc    Create POS Sale
// @route   POST /api/sales
const createSale = async (req, res, next) => {
  try {
    const {
      customerId,
      customerName = 'Walk-in Customer',
      customerPhone = '',
      items,
      paymentMethod = 'cash',
      paidAmount = 0,
      discountTotal = 0,
      taxTotal = 0,
      saleStatus = 'completed',
      notes = '',
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    // Generate Invoice Number
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${1000 + count + 1}`;

    let subtotal = 0;
    const formattedItems = [];

    // Verify stock and prepare items
    for (const item of items) {
      const prod = await Product.findById(item.product);
      if (!prod) throw new Error(`Product ${item.product} not found`);

      const qty = Number(item.quantity);
      if (saleStatus === 'completed' && prod.currentStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${prod.name}". Available: ${prod.currentStock}, Requested: ${qty}`,
        });
      }

      const unitPrice = Number(item.unitPrice || prod.sellingPrice);
      const discount = Number(item.discount || 0);
      const taxRate = Number(item.taxRate || prod.taxRate || 0);

      const base = qty * unitPrice;
      const disc = (base * discount) / 100;
      const itemTax = ((base - disc) * taxRate) / 100;
      const itemTotal = base - disc + itemTax;

      subtotal += base;

      formattedItems.push({
        product: prod._id,
        productName: prod.name,
        sku: prod.sku,
        quantity: qty,
        unitPrice,
        purchaseCost: prod.purchasePrice || 0,
        discount,
        taxRate,
        subtotal: itemTotal,
      });
    }

    const calculatedGrandTotal = Math.max(0, subtotal - Number(discountTotal) + Number(taxTotal));
    const paid = Number(paidAmount);
    const changeAmount = paid > calculatedGrandTotal ? paid - calculatedGrandTotal : 0;
    const effectivePaid = Math.min(paid, calculatedGrandTotal);

    let paymentStatus = 'paid';
    if (effectivePaid === 0) paymentStatus = 'pending';
    else if (effectivePaid < calculatedGrandTotal) paymentStatus = 'partial';

    // Create Sale
    const sale = await Sale.create({
      invoiceNumber,
      customer: customerId || undefined,
      customerName,
      customerPhone,
      items: formattedItems,
      subtotal,
      discountTotal: Number(discountTotal),
      taxTotal: Number(taxTotal),
      grandTotal: calculatedGrandTotal,
      paidAmount: effectivePaid,
      changeAmount,
      paymentMethod,
      paymentStatus,
      saleStatus,
      notes,
      user: req.user?.id,
    });

    // If saleStatus is 'completed', deduct inventory & create stock movements
    if (saleStatus === 'completed') {
      for (const item of formattedItems) {
        await adjustStock({
          productId: item.product,
          quantityChange: -Math.abs(item.quantity),
          type: 'SALE',
          unitCost: item.purchaseCost,
          referenceId: invoiceNumber,
          referenceType: 'Sales Invoice',
          reason: `Sold via POS Invoice ${invoiceNumber}`,
          userId: req.user?.id,
        });
      }

      // Create Invoice record
      const invoice = await Invoice.create({
        invoiceNumber,
        sale: sale._id,
        customer: {
          id: customerId || undefined,
          name: customerName,
          phone: customerPhone,
        },
        items: formattedItems.map((i) => ({
          product: i.product,
          name: i.productName,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
          taxRate: i.taxRate,
          subtotal: i.subtotal,
        })),
        subtotal,
        discountTotal: Number(discountTotal),
        taxTotal: Number(taxTotal),
        grandTotal: calculatedGrandTotal,
        paidAmount: effectivePaid,
        dueAmount: Math.max(0, calculatedGrandTotal - effectivePaid),
        paymentMethod,
        paymentStatus,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Net 15
        notes: notes || 'Thank you for your purchase!',
      });

      // Record Payment receipt if paid > 0
      if (effectivePaid > 0) {
        const payCount = await Payment.countDocuments();
        await Payment.create({
          paymentNumber: `REC-${1000 + payCount + 1}`,
          type: 'customer_receipt',
          sale: sale._id,
          customer: customerId || undefined,
          partyName: customerName,
          amount: effectivePaid,
          paymentMethod,
          referenceNumber: invoiceNumber,
          notes: `POS Payment for ${invoiceNumber}`,
          user: req.user?.id,
        });
      }

      // Update customer balance if customer selected and unpaid amount exists
      if (customerId && calculatedGrandTotal > effectivePaid) {
        const cust = await Customer.findById(customerId);
        if (cust) {
          cust.currentBalance = (cust.currentBalance || 0) + (calculatedGrandTotal - effectivePaid);
          await cust.save();
        }
      }

      await logActivity({
        user: req.user,
        action: 'CREATE',
        module: 'Sale',
        details: `POS Sale completed: Invoice ${invoiceNumber} for ₹${calculatedGrandTotal} (${paymentMethod})`,
        newValues: sale,
        req,
      });

      return res.status(201).json({
        success: true,
        message: 'Sale completed successfully',
        data: { sale, invoice },
      });
    }

    // If held sale
    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Sale',
      details: `POS Sale placed on hold: Ref ${invoiceNumber}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Sale held successfully',
      data: { sale },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
};
