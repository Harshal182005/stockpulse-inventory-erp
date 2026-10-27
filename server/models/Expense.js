const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Rent', 'Electricity', 'Salary', 'Transport', 'Maintenance', 'Marketing', 'Other'],
      default: 'Other',
    },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'],
      default: 'cash',
    },
    description: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
