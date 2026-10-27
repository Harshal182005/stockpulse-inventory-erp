const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Warehouse = require('../models/Warehouse');
const { adjustStock } = require('../services/stockService');
const { logActivity } = require('../services/auditService');

// @desc    Get complete inventory summary & valuation
// @route   GET /api/inventory/summary
const getInventorySummary = async (req, res, next) => {
  try {
    const products = await Product.find({ status: 'active' });

    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = p.currentStock || 0;
      totalStockUnits += stock;
      totalCostValuation += stock * (p.purchasePrice || 0);
      totalRetailValuation += stock * (p.sellingPrice || 0);

      if (stock === 0) outOfStockCount++;
      else if (stock <= p.minStock) lowStockCount++;
    });

    const potentialProfit = totalRetailValuation - totalCostValuation;

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalStockUnits,
        totalCostValuation,
        totalRetailValuation,
        potentialProfit,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust product stock (Stock In / Stock Out / Audit correction)
// @route   POST /api/inventory/adjust
const adjustProductStock = async (req, res, next) => {
  try {
    const { productId, quantityChange, type = 'ADJUSTMENT', reason, warehouseId } = req.body;

    if (!productId || quantityChange === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity change are required' });
    }

    const { product, movement } = await adjustStock({
      productId,
      quantityChange: Number(quantityChange),
      type,
      warehouseId,
      reason,
      userId: req.user?.id,
    });

    await logActivity({
      user: req.user,
      action: 'STOCK_ADJUSTMENT',
      module: 'Stock',
      details: `Adjusted stock for ${product.name} by ${quantityChange > 0 ? '+' : ''}${quantityChange} units (${reason || 'Adjustment'})`,
      req,
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: { product, movement },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer stock between warehouses
// @route   POST /api/inventory/transfer
const transferStock = async (req, res, next) => {
  try {
    const { productId, sourceWarehouseId, destinationWarehouseId, quantity, reason } = req.body;

    if (!productId || !sourceWarehouseId || !destinationWarehouseId || !quantity) {
      return res.status(400).json({ success: false, message: 'All transfer fields are required' });
    }

    if (sourceWarehouseId === destinationWarehouseId) {
      return res.status(400).json({ success: false, message: 'Source and destination warehouses must be different' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.currentStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for transfer. Current stock: ${product.currentStock}`,
      });
    }

    const [srcWh, destWh] = await Promise.all([
      Warehouse.findById(sourceWarehouseId),
      Warehouse.findById(destinationWarehouseId),
    ]);

    // Update product warehouse reference to destination
    product.warehouse = destinationWarehouseId;
    await product.save();

    const movement = await StockMovement.create({
      product: product._id,
      warehouse: sourceWarehouseId,
      destinationWarehouse: destinationWarehouseId,
      type: 'TRANSFER',
      quantity,
      previousStock: product.currentStock,
      newStock: product.currentStock,
      unitCost: product.purchasePrice,
      referenceType: 'Warehouse Transfer',
      reason: reason || `Transferred from ${srcWh?.name || 'Src'} to ${destWh?.name || 'Dest'}`,
      user: req.user?.id,
    });

    await logActivity({
      user: req.user,
      action: 'STOCK_TRANSFER',
      module: 'Stock',
      details: `Transferred ${quantity} units of ${product.name} from ${srcWh?.name} to ${destWh?.name}`,
      req,
    });

    res.json({
      success: true,
      message: 'Stock transferred successfully',
      data: { product, movement },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all stock movements audit trail
// @route   GET /api/inventory/movements
const getStockMovements = async (req, res, next) => {
  try {
    const { product, type, warehouse, page = 1, limit = 25 } = req.query;
    const query = {};

    if (product) query.product = product;
    if (type) query.type = type;
    if (warehouse) query.warehouse = warehouse;

    const skip = (Number(page) - 1) * Number(limit);
    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .populate('product', 'name sku barcode unit')
        .populate('warehouse', 'name code')
        .populate('destinationWarehouse', 'name code')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StockMovement.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: movements,
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

module.exports = {
  getInventorySummary,
  adjustProductStock,
  transferStock,
  getStockMovements,
};
