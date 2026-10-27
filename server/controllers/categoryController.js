const Category = require('../models/Category');
const Product = require('../models/Product');
const { logActivity } = require('../services/auditService');

// @desc    Get all categories with product count & total stock
// @route   GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    const enhanced = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id });
        const products = await Product.find({ category: cat._id }).select('currentStock sellingPrice');
        const totalStock = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
        const totalStockValue = products.reduce((acc, p) => acc + (p.currentStock || 0) * (p.sellingPrice || 0), 0);

        return {
          ...cat.toObject(),
          productCount,
          totalStock,
          totalStockValue,
        };
      })
    );

    res.json({ success: true, data: enhanced });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    await logActivity({
      user: req.user,
      action: 'CREATE',
      module: 'Category',
      details: `Created category: ${category.name}`,
      newValues: category,
      req,
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    await logActivity({
      user: req.user,
      action: 'UPDATE',
      module: 'Category',
      details: `Updated category: ${category.name}`,
      req,
    });

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} assigned products. Reassign them first.`,
      });
    }

    await category.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE',
      module: 'Category',
      details: `Deleted category: ${category.name}`,
      req,
    });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
