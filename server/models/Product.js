const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    barcode: { type: String, unique: true, sparse: true, trim: true },
    qrCode: { type: String, trim: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    rack: { type: String, default: 'A1' },
    shelf: { type: String, default: 'S1' },
    purchasePrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 }, // percentage
    taxRate: { type: Number, default: 18 }, // GST %
    unit: { type: String, default: 'pcs' },
    currentStock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 10 },
    maxStock: { type: Number, default: 500 },
    reorderLevel: { type: Number, default: 15 },
    leadTimeDays: { type: Number, default: 5 }, // for AI prediction
    mfgDate: { type: Date },
    expiryDate: { type: Date },
    batchNumber: { type: String, default: 'BATCH-001' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('stockStatus').get(function () {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minStock) return 'low_stock';
  return 'in_stock';
});

productSchema.virtual('expiryStatus').get(function () {
  if (!this.expiryDate) return 'safe';
  const now = new Date();
  const exp = new Date(this.expiryDate);
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays === 0) return 'expiring_today';
  if (diffDays <= 7) return 'expiring_7_days';
  if (diffDays <= 30) return 'expiring_30_days';
  return 'safe';
});

// Indexes for fast searching & filtering
productSchema.index({ name: 'text', sku: 'text', barcode: 'text', description: 'text' });
productSchema.index({ category: 1, currentStock: 1 });

module.exports = mongoose.model('Product', productSchema);
