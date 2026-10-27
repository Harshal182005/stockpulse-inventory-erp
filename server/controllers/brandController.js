const Brand = require('../models/Brand');
const Product = require('../models/Product');
const { logActivity } = require('../services/auditService');

// @desc    Get all brands with product count
// @route   GET /api/brands
const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });

    const enhanced = await Promise.all(
      brands.map(async (b) => {
        const productCount = await Product.countDocuments({ brand: b._id });
        const products = await Product.find({ brand: b._id }).select('currentStock sellingPrice');
        const totalStock = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
        return {
          ...b.toObject(),
          productCount,
          totalStock,
        };
      })
    );

    res.json({ success: true, data: enhanced });
  } catch (error) {
    next(error);
  }
};

// @desc    Create brand
// @route   POST /api/brands
const createBrand = async (req, res, next) => {
  try {
    const brand = await Brand.create(req.body);
    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Brand',
      details: `Created brand: ${brand.name}`,
      req,
    });
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'Brand',
      details: `Updated brand: ${brand.name}`,
      req,
    });

    res.json({ success: true, data: brand });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    const count = await Product.countDocuments({ brand: brand._id });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete brand with ${count} assigned products.`,
      });
    }

    await brand.deleteOne();
    await logActivity({
      user: req.user,
      action: 'DELETE',
      module: 'Brand',
      details: `Deleted brand: ${brand.name}`,
      req,
    });

    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
};
