const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    business: {
      name: { type: String, default: 'StockPulse Inventory Systems Ltd.' },
      legalName: { type: String, default: 'StockPulse Technologies Private Limited' },
      email: { type: String, default: 'contact@stockpulse.local' },
      phone: { type: String, default: '+91 98765 43210' },
      address: { type: String, default: 'Plot 42, Tech Park Avenue, Silicon Valley' },
      gstNumber: { type: String, default: '29ABCDE1234F1Z5' },
      currency: { type: String, default: 'INR' },
      currencySymbol: { type: String, default: '₹' },
      logoUrl: { type: String, default: '' },
    },
    invoice: {
      prefix: { type: String, default: 'INV' },
      purchasePrefix: { type: String, default: 'PO' },
      startingNumber: { type: Number, default: 1001 },
      defaultTaxRate: { type: Number, default: 18 },
      termsAndConditions: {
        type: String,
        default: '1. Goods once sold will not be taken back unless damaged on delivery.\n2. Payment is due within invoice terms.',
      },
      footerText: { type: String, default: 'Thank you for choosing StockPulse!' },
    },
    notification: {
      lowStockThreshold: { type: Number, default: 10 },
      expiryAlertDays: { type: Number, default: 30 },
      emailAlertsEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
