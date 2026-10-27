const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
    customer: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
      name: { type: String, required: true },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      gstNumber: { type: String, default: '' },
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        sku: String,
        quantity: Number,
        unitPrice: Number,
        discount: Number,
        taxRate: Number,
        subtotal: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'cash' },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'pending', 'overdue', 'cancelled'],
      default: 'paid',
    },
    dueDate: { type: Date },
    notes: { type: String, default: 'Thank you for your business!' },
    pdfUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
