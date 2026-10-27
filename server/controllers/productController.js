const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { logActivity } = require('../services/auditService');

// @desc    Get all products with filters, search, sort, pagination
// @route   GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      supplier,
      warehouse,
      status,
      stockStatus,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (supplier) query.supplier = supplier;
    if (warehouse) query.warehouse = warehouse;
    if (status) query.status = status;

    if (stockStatus === 'out_of_stock') {
      query.currentStock = { $lte: 0 };
    } else if (stockStatus === 'low_stock') {
      query.$expr = { $lte: ['$currentStock', '$minStock'] };
    } else if (stockStatus === 'in_stock') {
      query.$expr = { $gt: ['$currentStock', '$minStock'] };
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('brand', 'name')
        .populate('supplier', 'name companyName')
        .populate('warehouse', 'name code')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
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

// @desc    Get product by ID
// @route   GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('brand')
      .populate('supplier')
      .populate('warehouse');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Auto-generate barcode if missing
    if (!data.barcode) {
      data.barcode = '890' + Math.floor(100000000 + Math.random() * 900000000);
    }
    // Auto-generate QR code data if missing
    if (!data.qrCode) {
      data.qrCode = JSON.stringify({ sku: data.sku, name: data.name, price: data.sellingPrice });
    }

    const product = await Product.create(data);

    // Initial stock movement if currentStock > 0
    if (product.currentStock > 0) {
      await StockMovement.create({
        product: product._id,
        warehouse: product.warehouse,
        type: 'IN',
        quantity: product.currentStock,
        previousStock: 0,
        newStock: product.currentStock,
        unitCost: product.purchasePrice,
        referenceType: 'Opening Stock',
        reason: 'Initial Opening Stock Entry',
        user: req.user?.id,
      });
    }

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Product',
      details: `Created product "${product.name}" with SKU: ${product.sku}`,
      newValues: product,
      req,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const oldValues = product.toObject();
    Object.assign(product, req.body);
    await product.save();

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'Product',
      details: `Updated product "${product.name}" (SKU: ${product.sku})`,
      oldValues,
      newValues: product.toObject(),
      req,
    });

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE',
      module: 'Product',
      details: `Deleted product "${product.name}" (SKU: ${product.sku})`,
      req,
    });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import products
// @route   POST /api/products/bulk-import
const bulkImport = async (req, res, next) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Products array is required' });
    }

    const imported = [];
    for (const item of products) {
      if (!item.barcode) {
        item.barcode = '890' + Math.floor(100000000 + Math.random() * 900000000);
      }
      const prod = await Product.create(item);
      imported.push(prod);
    }

    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Product',
      details: `Bulk imported ${imported.length} products`,
      req,
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${imported.length} products`,
      data: imported,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
const getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$currentStock', '$minStock'] },
      status: 'active',
    })
      .populate('category', 'name')
      .populate('supplier', 'name companyName phone')
      .populate('warehouse', 'name code');

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expiring products
// @route   GET /api/products/expiring
const getExpiring = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + Number(days));

    const products = await Product.find({
      expiryDate: { $lte: futureDate },
      status: 'active',
    })
      .populate('category', 'name')
      .populate('warehouse', 'name code')
      .sort({ expiryDate: 1 });

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product stock history / movement logs
// @route   GET /api/products/:id/history
const getProductHistory = async (req, res, next) => {
  try {
    const movements = await StockMovement.find({ product: req.params.id })
      .populate('warehouse', 'name code')
      .populate('destinationWarehouse', 'name code')
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImport,
  getLowStock,
  getExpiring,
  getProductHistory,
};
