const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' },
    },
    gstNumber: { type: String, trim: true },
    taxInfo: { type: String, default: '' },
    paymentTerms: { type: String, default: 'Net 30' },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 }, // Amount we owe to supplier
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
