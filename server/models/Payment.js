const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, required: true, unique: true, uppercase: true },
    type: {
      type: String,
      enum: ['customer_receipt', 'supplier_payment'],
      required: true,
    },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    partyName: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'credit'],
      default: 'cash',
    },
    referenceNumber: { type: String, default: '' }, // Cheque #, UTR #, Txn ID
    notes: { type: String, default: '' },
    paymentDate: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
