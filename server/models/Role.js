const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  view: { type: Boolean, default: true },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  export: { type: Boolean, default: false },
  approve: { type: Boolean, default: false },
});

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['admin', 'manager', 'staff', 'accountant'],
    },
    description: { type: String, default: '' },
    permissions: [permissionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
