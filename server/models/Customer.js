const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
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
    creditLimit: { type: Number, default: 50000 },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 }, // Amount customer owes to us
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
