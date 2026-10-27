const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const { logActivity } = require('../services/auditService');

// @desc    Get all warehouses with utilization
// @route   GET /api/warehouses
const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 });

    const enhanced = await Promise.all(
      warehouses.map(async (wh) => {
        const products = await Product.find({ warehouse: wh._id }).select('currentStock sellingPrice');
        const totalItemsCount = products.length;
        const totalStockUnits = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
        const totalValuation = products.reduce((acc, p) => acc + (p.currentStock || 0) * (p.sellingPrice || 0), 0);
        const utilizationPercentage = wh.capacity > 0 ? Math.min(100, Math.round((totalStockUnits / wh.capacity) * 100)) : 0;

        return {
          ...wh.toObject(),
          totalItemsCount,
          totalStockUnits,
          totalValuation,
          utilizationPercentage,
        };
      })
    );

    res.json({ success: true, data: enhanced });
  } catch (error) {
    next(error);
  }
};

// @desc    Get warehouse inventory
// @route   GET /api/warehouses/:id/inventory
const getWarehouseInventory = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });

    const products = await Product.find({ warehouse: warehouse._id })
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ name: 1 });

    res.json({ success: true, warehouse, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Create warehouse
// @route   POST /api/warehouses
const createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Warehouse',
      details: `Created warehouse: ${warehouse.name} (${warehouse.code})`,
      req,
    });
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
};

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
const updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'Warehouse',
      details: `Updated warehouse: ${warehouse.name}`,
      req,
    });

    res.json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
const deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });

    const count = await Product.countDocuments({ warehouse: warehouse._id });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete warehouse containing ${count} inventory products. Transfer them first.`,
      });
    }

    await warehouse.deleteOne();
    await logActivity({
      user: req.user,
      action: 'DELETE',
      module: 'Warehouse',
      details: `Deleted warehouse: ${warehouse.name}`,
      req,
    });

    res.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWarehouses,
  getWarehouseInventory,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
};
