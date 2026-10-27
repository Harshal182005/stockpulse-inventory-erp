const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'System' },
    userRole: { type: String, default: 'admin' },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT', 'LOGIN', 'EXPORT'],
      required: true,
    },
    module: {
      type: String,
      enum: ['Auth', 'Product', 'Category', 'Brand', 'Supplier', 'Customer', 'Warehouse', 'Stock', 'Purchase', 'PurchaseReturn', 'Sale', 'SalesReturn', 'Invoice', 'Payment', 'Expense', 'Settings', 'User', 'Role'],
      required: true,
    },
    details: { type: String, required: true },
    oldValues: { type: mongoose.Schema.Types.Mixed },
    newValues: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
