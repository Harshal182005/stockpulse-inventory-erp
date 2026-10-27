const mongoose = require('mongoose');

const salesReturnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  refundAmount: { type: Number, required: true },
  reason: { type: String, default: 'Defective/Customer changed mind' },
});

const salesReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true, uppercase: true },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, default: 'Walk-in Customer' },
    items: [salesReturnItemSchema],
    totalRefund: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['completed', 'cancelled'],
      default: 'completed',
    },
    notes: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesReturn', salesReturnSchema);
