const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
const path = require('path');

// Fix for Windows DNS refusing MongoDB Atlas SRV lookups (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
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

const seedReference = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing records...');
    await Promise.all([
      User.deleteMany({}),
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

    // 1. Users (All 4 Personas)
    console.log('Seeding standard role users...');
    const users = await User.create([
      {
        name: 'Alexander Wright (Admin)',
        email: 'admin@inventory.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '+91 99999 99999',
      },
      {
        name: 'Sophia Patel (Manager)',
        email: 'manager@inventory.com',
        password: 'Manager@123',
        role: 'manager',
        phone: '+91 98888 88888',
      },
      {
        name: 'David Miller (Staff)',
        email: 'staff@inventory.com',
        password: 'Staff@123',
        role: 'staff',
        phone: '+91 97777 77777',
      },
      {
        name: 'Emma Watson (Accountant)',
        email: 'accountant@inventory.com',
        password: 'Accountant@123',
        role: 'accountant',
        phone: '+91 96666 66666',
      },
    ]);
    const adminUser = users[0];
    const managerUser = users[1];
    const staffUser = users[2];

    // 2. Settings
    console.log('Seeding company settings...');
    await Settings.create({
      business: {
        name: 'StockPulse Retail & Wholesale Solutions',
        legalName: 'StockPulse Commercial Enterprises Pvt. Ltd.',
        email: 'contact@stockpulse.local',
        phone: '+91 98765 43210',
        address: 'Plot 104, Industrial Corridor, Tech Zone-2, Bangalore 560100',
        gstNumber: '29ABCDE1234F1Z5',
        currency: 'INR',
        currencySymbol: '₹',
      },
      invoice: {
        prefix: 'INV',
        purchasePrefix: 'PO',
        startingNumber: 1001,
        defaultTaxRate: 18,
        termsAndConditions: '1. Goods once sold are covered under 1-year manufacturer warranty.\n2. Invoice required for all returns within 7 days.',
        footerText: 'Thank you for choosing StockPulse!',
      },
      notification: {
        lowStockThreshold: 15,
        expiryAlertDays: 30,
        emailAlertsEnabled: true,
      },
    });

    // 3. Warehouses (2 facilities)
    console.log('Seeding warehouses...');
    const warehouses = await Warehouse.create([
      {
        name: 'Central Distribution Hub',
        code: 'WH-BLR-01',
        address: {
          street: 'Block 4, Warehouse Complex',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560100',
          country: 'India',
        },
        capacity: 25000,
        currentUtilization: 4200,
        manager: managerUser._id,
        isActive: true,
      },
      {
        name: 'North Logistics Facility',
        code: 'WH-DEL-02',
        address: {
          street: 'Sector 18, Transport Nagar',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110042',
          country: 'India',
        },
        capacity: 15000,
        currentUtilization: 1800,
        manager: managerUser._id,
        isActive: true,
      },
    ]);

    // 4. Categories (3 categories)
    console.log('Seeding categories...');
    const categories = await Category.create([
      {
        name: 'Electronics & Gadgets',
        description: 'Laptops, smart monitors, headphones and peripheral accessories',
        status: 'active',
      },
      {
        name: 'Office Stationery',
        description: 'Printing papers, executive notebooks, markers, and folders',
        status: 'active',
      },
      {
        name: 'Health & Personal Care',
        description: 'Sanitizers, wellness supplements, first aid essentials',
        status: 'active',
      },
    ]);

    // 5. Brands (3 brands)
    console.log('Seeding brands...');
    const brands = await Brand.create([
      {
        name: 'ProTech Labs',
        description: 'High performance consumer electronics and peripherals',
        website: 'https://protechlabs.example.com',
        status: 'active',
      },
      {
        name: 'PaperKraft',
        description: 'Eco-friendly premium office supplies and paper products',
        website: 'https://paperkraft.example.com',
        status: 'active',
      },
      {
        name: 'MediPure',
        description: 'Certified clinical wellness and personal care supplies',
        website: 'https://medipure.example.com',
        status: 'active',
      },
    ]);

    // 6. Suppliers (3 suppliers)
    console.log('Seeding suppliers...');
    const suppliers = await Supplier.create([
      {
        companyName: 'Apex Electronic Distributors Ltd.',
        name: 'Rajesh Sharma',
        email: 'rajesh@apexdist.example.com',
        phone: '+91 98111 22334',
        gstNumber: '27AABCU9603R1ZM',
        address: {
          street: '45, Lamington Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400007',
          country: 'India',
        },
        paymentTerms: 'Net 30',
        currentBalance: 0,
      },
      {
        companyName: 'Evergreen Office Supplies Co.',
        name: 'Sunita Reddy',
        email: 'orders@evergreensupplies.example.com',
        phone: '+91 98222 33445',
        gstNumber: '36AAACE2288H1ZV',
        address: {
          street: '12, Begumpet Main Road',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500016',
          country: 'India',
        },
        paymentTerms: 'Net 15',
        currentBalance: 8500,
      },
      {
        companyName: 'MediCare Bulk Pharmaceuticals',
        name: 'Dr. Vikram Sen',
        email: 'sales@medicarebulk.example.com',
        phone: '+91 98333 44556',
        gstNumber: '19AAACG7722M1ZW',
        address: {
          street: '78, Salt Lake Sector V',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700091',
          country: 'India',
        },
        paymentTerms: 'Immediate',
        currentBalance: 0,
      },
    ]);

    // 7. Customers (3 customers)
    console.log('Seeding customers...');
    const customers = await Customer.create([
      {
        name: 'Nexus Digital Workspace Pvt Ltd',
        email: 'procurement@nexusworkspace.example.com',
        phone: '+91 98444 55667',
        gstNumber: '29AABCN8833P1ZK',
        address: {
          street: 'Tower B, Outer Ring Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560103',
          country: 'India',
        },
        creditLimit: 100000,
        currentBalance: 12500,
      },
      {
        name: 'Horizon International Academy',
        email: 'admin@horizonacademy.example.com',
        phone: '+91 98555 66778',
        gstNumber: '29AABCH4455D1ZN',
        address: {
          street: 'Campus Road, Whitefield',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560066',
          country: 'India',
        },
        creditLimit: 50000,
        currentBalance: 0,
      },
      {
        name: 'Walk-in Retail Shopper',
        email: 'shopper@stockpulse.local',
        phone: '+91 98666 77889',
        address: {
          street: 'MG Road Counter 1',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
        },
        creditLimit: 0,
        currentBalance: 0,
      },
    ]);

    // 8. Products (4 Products: In Stock, Low Stock, Expiring Soon, Out of Stock)
    console.log('Seeding products with diverse stock states...');
    const today = new Date();
    const expirySoon = new Date();
    expirySoon.setDate(today.getDate() + 18); // 18 days from now -> Expiring soon alert!

    const expirySafe = new Date();
    expirySafe.setDate(today.getDate() + 365); // 1 year from now -> Safe

    const products = await Product.create([
      {
        name: 'UltraSpeed Pro Wireless Gaming Mouse',
        sku: 'ELEC-WGM-001',
        barcode: '8901234500018',
        category: categories[0]._id,
        brand: brands[0]._id,
        supplier: suppliers[0]._id,
        purchasePrice: 1200,
        sellingPrice: 2499,
        discount: 5,
        tax: 18,
        unit: 'pcs',
        currentStock: 85,
        minStockLevel: 20,
        reorderLevel: 25,
        warehouse: warehouses[0]._id,
        rack: 'A3-04',
        batchNumber: 'BAT-2026-M1',
        status: 'active',
      },
      {
        name: 'Executive A4 Spiral Notebook 200 Pages (Pack of 5)',
        sku: 'STAT-NBK-002',
        barcode: '8901234500025',
        category: categories[1]._id,
        brand: brands[1]._id,
        supplier: suppliers[1]._id,
        purchasePrice: 250,
        sellingPrice: 499,
        discount: 0,
        tax: 12,
        unit: 'pack',
        currentStock: 8, // Below minStockLevel 15 -> Low Stock alert!
        minStockLevel: 15,
        reorderLevel: 20,
        warehouse: warehouses[0]._id,
        rack: 'B1-12',
        batchNumber: 'BAT-2026-P2',
        status: 'active',
      },
      {
        name: 'MediPure Aloe Instant Hand Sanitizer 500ml',
        sku: 'HLTH-SAN-003',
        barcode: '8901234500032',
        category: categories[2]._id,
        brand: brands[2]._id,
        supplier: suppliers[2]._id,
        purchasePrice: 90,
        sellingPrice: 180,
        discount: 10,
        tax: 18,
        unit: 'bottle',
        currentStock: 60,
        minStockLevel: 20,
        reorderLevel: 30,
        warehouse: warehouses[1]._id,
        rack: 'C2-01',
        batchNumber: 'BAT-2025-S3',
        manufacturingDate: new Date('2025-04-10'),
        expiryDate: expirySoon, // Expiring soon reference!
        status: 'active',
      },
      {
        name: '4K Ultra-HD USB-C Webcam with Mic',
        sku: 'ELEC-CAM-004',
        barcode: '8901234500049',
        category: categories[0]._id,
        brand: brands[0]._id,
        supplier: suppliers[0]._id,
        purchasePrice: 3500,
        sellingPrice: 6200,
        discount: 0,
        tax: 18,
        unit: 'pcs',
        currentStock: 0, // Out of Stock reference!
        minStockLevel: 10,
        reorderLevel: 15,
        warehouse: warehouses[0]._id,
        rack: 'A1-02',
        batchNumber: 'BAT-2026-C4',
        status: 'active',
      },
    ]);

    // 9. Stock Movement Audit Logs
    console.log('Seeding stock movements...');
    await StockMovement.create([
      {
        product: products[0]._id,
        warehouse: warehouses[0]._id,
        type: 'IN',
        quantity: 100,
        previousStock: 0,
        newStock: 100,
        reason: 'Initial opening stock receipt',
        performedBy: adminUser._id,
      },
      {
        product: products[1]._id,
        warehouse: warehouses[0]._id,
        type: 'IN',
        quantity: 20,
        previousStock: 0,
        newStock: 20,
        reason: 'Initial opening stock receipt',
        performedBy: adminUser._id,
      },
      {
        product: products[0]._id,
        warehouse: warehouses[0]._id,
        type: 'OUT',
        quantity: 15,
        previousStock: 100,
        newStock: 85,
        reason: 'POS Customer sale checkout',
        performedBy: staffUser._id,
      },
    ]);

    // 10. Sample Purchase Order
    console.log('Seeding sample purchase order...');
    const poItems = [
      {
        product: products[0]._id,
        productName: products[0].name,
        sku: products[0].sku,
        quantity: 50,
        unitCost: 1200,
        taxRate: 18,
        discount: 0,
        subtotal: 60000,
      },
    ];
    await Purchase.create({
      purchaseNumber: 'PO-2026-1001',
      supplier: suppliers[0]._id,
      warehouse: warehouses[0]._id,
      items: poItems,
      subtotal: 60000,
      taxTotal: 10800,
      grandTotal: 70800,
      paidAmount: 70800,
      paymentStatus: 'paid',
      orderStatus: 'received',
      user: managerUser._id,
      notes: 'Standard monthly replenishment order.',
    });

    // 11. Sample Sale Order & Invoice
    console.log('Seeding sample sales & invoice...');
    const saleItems = [
      {
        product: products[0]._id,
        productName: products[0].name,
        sku: products[0].sku,
        quantity: 2,
        unitPrice: 2499,
        purchaseCost: 1200,
        discount: 0,
        taxRate: 18,
        subtotal: 4998,
      },
      {
        product: products[1]._id,
        productName: products[1].name,
        sku: products[1].sku,
        quantity: 1,
        unitPrice: 499,
        purchaseCost: 250,
        discount: 0,
        taxRate: 12,
        subtotal: 499,
      },
    ];

    const sampleSale = await Sale.create({
      invoiceNumber: 'INV-2026-1001',
      customer: customers[0]._id,
      customerName: customers[0].name,
      customerPhone: customers[0].phone,
      items: saleItems,
      subtotal: 5497,
      taxTotal: 959.52,
      discountTotal: 0,
      grandTotal: 6456.52,
      paidAmount: 6456.52,
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      saleStatus: 'completed',
      user: staffUser._id,
    });

    await Invoice.create({
      invoiceNumber: 'INV-2026-1001',
      sale: sampleSale._id,
      customer: {
        id: customers[0]._id,
        name: customers[0].name,
        email: customers[0].email,
        phone: customers[0].phone,
        address: customers[0].address.street,
        gstNumber: customers[0].gstNumber,
      },
      items: [
        {
          product: products[0]._id,
          name: products[0].name,
          sku: products[0].sku,
          quantity: 2,
          unitPrice: 2499,
          discount: 0,
          taxRate: 18,
          subtotal: 4998,
        },
        {
          product: products[1]._id,
          name: products[1].name,
          sku: products[1].sku,
          quantity: 1,
          unitPrice: 499,
          discount: 0,
          taxRate: 12,
          subtotal: 499,
        },
      ],
      subtotal: 5497,
      taxTotal: 959.52,
      discountTotal: 0,
      grandTotal: 6456.52,
      paidAmount: 6456.52,
      dueAmount: 0,
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      dueDate: new Date(Date.now() + 15 * 86400000),
    });

    // 12. Sample Payments
    console.log('Seeding sample payment vouchers...');
    await Payment.create([
      {
        paymentNumber: 'PAY-2026-1001',
        type: 'customer_receipt',
        sale: sampleSale._id,
        customer: customers[0]._id,
        partyName: customers[0].name,
        amount: 6456.52,
        paymentMethod: 'upi',
        referenceNumber: 'UPI/2026/89403810',
        notes: 'Full payment received against INV-2026-1001',
        user: staffUser._id,
      },
      {
        paymentNumber: 'PAY-2026-1002',
        type: 'supplier_payment',
        supplier: suppliers[0]._id,
        partyName: suppliers[0].companyName,
        amount: 70800,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'NEFT/HDFC/9920138',
        notes: 'Vendor disbursement for PO-2026-1001',
        user: adminUser._id,
      },
    ]);

    // 13. Sample Operating Expenses
    console.log('Seeding sample expenses...');
    await Expense.create([
      {
        expenseNumber: 'EXP-2026-1001',
        title: 'Central Warehouse Monthly Lease',
        category: 'Rent',
        amount: 35000,
        date: new Date(),
        paymentMethod: 'bank_transfer',
        description: 'Monthly commercial rental payment for Central Distribution Hub',
        user: adminUser._id,
      },
      {
        expenseNumber: 'EXP-2026-1002',
        title: 'High-Speed Fiber Internet & Telephony',
        category: 'Maintenance',
        amount: 2800,
        date: new Date(),
        paymentMethod: 'upi',
        description: 'Facility broadband connection for POS terminals and ERP servers',
        user: adminUser._id,
      },
      {
        expenseNumber: 'EXP-2026-1003',
        title: 'Warehouse Electricity Utility Bill',
        category: 'Electricity',
        amount: 6450,
        date: new Date(),
        paymentMethod: 'bank_transfer',
        description: 'Commercial power consumption for cooling and conveyor equipment',
        user: adminUser._id,
      },
    ]);

    // 14. Notifications
    console.log('Seeding notifications...');
    await Notification.create([
      {
        title: 'Low Stock Alert: Executive Notebooks',
        message: 'Product "Executive A4 Spiral Notebook" has only 8 packs remaining in stock (Reorder point: 20).',
        type: 'low_stock',
        priority: 'high',
        link: '/inventory/low-stock',
        read: false,
      },
      {
        title: 'Batch Expiration Warning: Hand Sanitizer',
        message: 'Batch BAT-2025-S3 of MediPure Aloe Instant Hand Sanitizer expires in 18 days.',
        type: 'expiring',
        priority: 'medium',
        link: '/inventory/expiry',
        read: false,
      },
    ]);

    // 15. Audit Log
    console.log('Seeding audit logs...');
    await AuditLog.create([
      {
        user: adminUser._id,
        userName: adminUser.name,
        userRole: adminUser.role,
        action: 'CREATE',
        module: 'Settings',
        details: 'Clean 2-3 standard reference records created across all modules.',
        ipAddress: '127.0.0.1',
      },
    ]);

    console.log('🎉 2-3 Reference records in EVERY module seeded successfully into MongoDB Atlas!');
    process.exit(0);
  } catch (error) {
    console.error('Seed reference error:', error);
    process.exit(1);
  }
};

seedReference();
