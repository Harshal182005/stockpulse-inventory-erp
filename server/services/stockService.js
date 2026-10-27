const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Notification = require('../models/Notification');

/**
 * Adjust stock of a product and log the movement
 */
const adjustStock = async ({
  productId,
  quantityChange, // positive for addition, negative for deduction
  type, // 'IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'PURCHASE', 'SALE', etc.
  warehouseId,
  destinationWarehouseId,
  unitCost,
  referenceId,
  referenceType,
  reason,
  userId,
}) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const previousStock = product.currentStock;
  const newStock = Math.max(0, previousStock + quantityChange);

  product.currentStock = newStock;
  if (warehouseId) product.warehouse = warehouseId;
  await product.save();

  const movement = await StockMovement.create({
    product: productId,
    warehouse: warehouseId || product.warehouse,
    destinationWarehouse: destinationWarehouseId,
    type,
    quantity: Math.abs(quantityChange),
    previousStock,
    newStock,
    unitCost: unitCost || product.purchasePrice,
    referenceId,
    referenceType,
    reason: reason || `${type} of ${Math.abs(quantityChange)} ${product.unit}`,
    user: userId,
  });

  // Check stock alerts
  if (newStock === 0) {
    await Notification.create({
      title: 'Out of Stock Alert',
      message: `Product "${product.name}" (SKU: ${product.sku}) is now OUT OF STOCK!`,
      type: 'out_of_stock',
      priority: 'urgent',
      link: `/inventory/products/${product._id}`,
      metadata: { productId: product._id, sku: product.sku },
    });
  } else if (newStock <= product.minStock) {
    await Notification.create({
      title: 'Low Stock Alert',
      message: `Product "${product.name}" (SKU: ${product.sku}) has reached ${newStock} units (Min: ${product.minStock}).`,
      type: 'low_stock',
      priority: 'high',
      link: `/inventory/low-stock`,
      metadata: { productId: product._id, sku: product.sku },
    });
  }

  return { product, movement };
};

/**
 * Scan database for expiring products and create notifications
 */
const checkExpiringProducts = async () => {
  const now = new Date();
  const next30Days = new Date();
  next30Days.setDate(now.getDate() + 30);

  const expiringProducts = await Product.find({
    expiryDate: { $gte: now, $lte: next30Days },
    status: 'active',
  });

  for (const prod of expiringProducts) {
    const daysLeft = Math.ceil((new Date(prod.expiryDate) - now) / (1000 * 60 * 60 * 24));
    // Check if notification already created recently
    const existing = await Notification.findOne({
      type: 'expiring',
      'metadata.productId': prod._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (!existing) {
      await Notification.create({
        title: 'Product Expiring Soon',
        message: `Product "${prod.name}" (Batch: ${prod.batchNumber}) will expire in ${daysLeft} days on ${new Date(prod.expiryDate).toLocaleDateString()}.`,
        type: 'expiring',
        priority: daysLeft <= 7 ? 'urgent' : 'medium',
        link: `/inventory/expiry`,
        metadata: { productId: prod._id, batchNumber: prod.batchNumber, daysLeft },
      });
    }
  }
};

module.exports = {
  adjustStock,
  checkExpiringProducts,
};
