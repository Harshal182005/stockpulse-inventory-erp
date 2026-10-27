const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Fix for Windows DNS refusing MongoDB Atlas SRV lookups (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Role = require('../models/Role');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Warehouse = require('../models/Warehouse');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Settings = require('../models/Settings');

const resetToEmpty = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Wiping all demo records...');
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Warehouse.deleteMany({}),
      Supplier.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      StockMovement.deleteMany({}),
      Purchase.deleteMany({}),
      Sale.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      Expense.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      Settings.deleteMany({}),
    ]);

    // Create standard role accounts
    await User.create([
      {
        name: 'Primary Administrator',
        email: 'admin@inventory.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '+91 99999 99999',
      },
      {
        name: 'Inventory Operations Manager',
        email: 'manager@inventory.com',
        password: 'Manager@123',
        role: 'manager',
        phone: '+91 98888 88888',
      },
      {
        name: 'POS Billing Staff',
        email: 'staff@inventory.com',
        password: 'Staff@123',
        role: 'staff',
        phone: '+91 97777 77777',
      },
      {
        name: 'Lead Financial Accountant',
        email: 'accountant@inventory.com',
        password: 'Accountant@123',
        role: 'accountant',
        phone: '+91 96666 66666',
      },
    ]);

    // Create 1 Default Warehouse
    await Warehouse.create({
      name: 'Main Central Warehouse',
      code: 'WH-CENTRAL-01',
      address: {
        street: 'Main Facility, Industrial Area',
        city: 'Metropolis',
        state: 'State',
        pincode: '560100',
        country: 'India',
      },
      capacity: 50000,
      currentUtilization: 0,
      isActive: true,
    });

    // Create fresh Default Settings
    await Settings.create({
      business: {
        name: 'My Business Enterprise',
        legalName: 'My Business Private Limited',
        email: 'admin@mybusiness.com',
        phone: '+91 98765 43210',
        currency: 'INR',
        currencySymbol: '₹',
      },
      invoice: {
        prefix: 'INV',
        purchasePrefix: 'PO',
        startingNumber: 1001,
        defaultTaxRate: 18,
      },
      notification: {
        lowStockThreshold: 10,
        expiryAlertDays: 30,
        emailAlertsEnabled: true,
      },
    });

    console.log('✅ Database reset to clean blank state!');
    console.log('Admin login: admin@inventory.com / Admin@123');
    process.exit(0);
  } catch (error) {
    console.error('Reset error:', error);
    process.exit(1);
  }
};

resetToEmpty();
