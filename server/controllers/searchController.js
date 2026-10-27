const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');
const Category = require('../models/Category');

// @desc    Global search across multiple entities
// @route   GET /api/search
const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, results: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [products, customers, suppliers, invoices, purchases, categories] = await Promise.all([
      Product.find({
        $or: [{ name: regex }, { sku: regex }, { barcode: regex }],
      }).limit(5).select('name sku barcode currentStock sellingPrice'),
      Customer.find({
        $or: [{ name: regex }, { phone: regex }, { email: regex }],
      }).limit(5).select('name phone email currentBalance'),
      Supplier.find({
        $or: [{ name: regex }, { companyName: regex }, { phone: regex }],
      }).limit(5).select('name companyName phone'),
      Invoice.find({
        $or: [{ invoiceNumber: regex }, { 'customer.name': regex }],
      }).limit(5).select('invoiceNumber grandTotal customer paymentStatus'),
      Purchase.find({
        purchaseNumber: regex,
      }).limit(5).populate('supplier', 'companyName').select('purchaseNumber grandTotal orderStatus supplier'),
      Category.find({
        name: regex,
      }).limit(5).select('name slug'),
    ]);

    const results = [
      ...products.map((p) => ({
        type: 'Product',
        title: p.name,
        subtitle: `SKU: ${p.sku} | Stock: ${p.currentStock} | Price: ₹${p.sellingPrice}`,
        link: `/inventory/products/${p._id}`,
      })),
      ...customers.map((c) => ({
        type: 'Customer',
        title: c.name,
        subtitle: `Phone: ${c.phone} | Balance: ₹${c.currentBalance}`,
        link: `/sales/customers/${c._id}`,
      })),
      ...suppliers.map((s) => ({
        type: 'Supplier',
        title: s.companyName,
        subtitle: `Contact: ${s.name} | Phone: ${s.phone}`,
        link: `/purchases/suppliers/${s._id}`,
      })),
      ...invoices.map((inv) => ({
        type: 'Invoice',
        title: inv.invoiceNumber,
        subtitle: `${inv.customer?.name} | ₹${inv.grandTotal} (${inv.paymentStatus})`,
        link: `/sales/invoices/${inv._id}`,
      })),
      ...purchases.map((po) => ({
        type: 'Purchase',
        title: po.purchaseNumber,
        subtitle: `${po.supplier?.companyName} | ₹${po.grandTotal} (${po.orderStatus})`,
        link: `/purchases/${po._id}`,
      })),
      ...categories.map((cat) => ({
        type: 'Category',
        title: cat.name,
        subtitle: `Category`,
        link: `/inventory/categories`,
      })),
    ];

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch };
