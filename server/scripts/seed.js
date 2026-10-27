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

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
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

    console.log('Seeding Global Settings...');
    await Settings.create({
      business: {
        name: 'StockPulse Inventory Systems Ltd.',
        legalName: 'StockPulse Technologies Private Limited',
        email: 'contact@stockpulse.local',
        phone: '+91 98765 43210',
        address: 'Plot 42, Tech Park Avenue, Electronic City, Bangalore, India',
        gstNumber: '29ABCDE1234F1Z5',
        currency: 'INR',
        currencySymbol: '₹',
      },
      invoice: {
        prefix: 'INV',
        purchasePrefix: 'PO',
        startingNumber: 1001,
        defaultTaxRate: 18,
        termsAndConditions: '1. Goods once sold will not be taken back unless damaged upon delivery.\n2. Invoice payments are net 30 days.\n3. Warranty claims subject to OEM policies.',
        footerText: 'Thank you for your business! Empowering your supply chain with StockPulse.',
      },
      notification: {
        lowStockThreshold: 15,
        expiryAlertDays: 30,
        emailAlertsEnabled: true,
      },
    });

    console.log('Seeding Roles & Permissions...');
    const defaultModules = [
      'Products', 'Categories', 'Brands', 'Suppliers', 'Customers',
      'Purchases', 'Sales', 'Inventory', 'Expenses', 'Reports',
      'Settings', 'Users', 'Audit Logs'
    ];

    await Role.insertMany([
      {
        name: 'admin',
        description: 'Complete system access, permissions and administrative governance',
        permissions: defaultModules.map((m) => ({ module: m, view: true, create: true, edit: true, delete: true, export: true, approve: true })),
      },
      {
        name: 'manager',
        description: 'Operational manager for stock, purchases, sales, suppliers and analytics',
        permissions: defaultModules.map((m) => ({
          module: m,
          view: true,
          create: !['Users', 'Settings'].includes(m),
          edit: !['Users', 'Settings'].includes(m),
          delete: !['Users', 'Settings'].includes(m),
          export: true,
          approve: true,
        })),
      },
      {
        name: 'staff',
        description: 'Front-desk POS sales checkout, customer service, and stock checking',
        permissions: defaultModules.map((m) => ({
          module: m,
          view: ['Products', 'Sales', 'Customers', 'Inventory'].includes(m),
          create: ['Sales', 'Customers'].includes(m),
          edit: false,
          delete: false,
          export: false,
          approve: false,
        })),
      },
      {
        name: 'accountant',
        description: 'Financial ledger, billing records, expenses, receipts, and P&L statements',
        permissions: defaultModules.map((m) => ({
          module: m,
          view: ['Sales', 'Purchases', 'Expenses', 'Reports'].includes(m),
          create: ['Expenses'].includes(m),
          edit: ['Expenses'].includes(m),
          delete: false,
          export: true,
          approve: false,
        })),
      },
    ]);

    console.log('Seeding User Accounts...');
    const adminUser = await User.create({
      name: 'Alexander Wright',
      email: 'admin@inventory.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 00001',
      status: 'active',
    });

    const managerUser = await User.create({
      name: 'Sarah Jenkins',
      email: 'manager@inventory.com',
      password: 'Manager@123',
      role: 'manager',
      phone: '+91 98765 00002',
      status: 'active',
    });

    const staffUser = await User.create({
      name: 'David Miller',
      email: 'staff@inventory.com',
      password: 'Staff@123',
      role: 'staff',
      phone: '+91 98765 00003',
      status: 'active',
    });

    const accountantUser = await User.create({
      name: 'Elena Rostova',
      email: 'accountant@inventory.com',
      password: 'Accountant@123',
      role: 'accountant',
      phone: '+91 98765 00004',
      status: 'active',
    });

    console.log('Seeding Warehouses...');
    const warehouses = await Warehouse.insertMany([
      {
        name: 'Central Hub Alpha',
        code: 'WH-MAIN',
        address: { street: '100 Logistics Corridor', city: 'Bangalore', state: 'Karnataka', zipCode: '560100' },
        manager: 'Vikram Mehta',
        phone: '+91 80 4455 6677',
        email: 'central.hub@stockpulse.local',
        capacity: 25000,
        status: 'active',
      },
      {
        name: 'West Distribution Center',
        code: 'WH-WEST',
        address: { street: '45 Harbor Expressway', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001' },
        manager: 'Anil Desai',
        phone: '+91 22 8899 1122',
        email: 'west.hub@stockpulse.local',
        capacity: 15000,
        status: 'active',
      },
      {
        name: 'North Fulfillment Depot',
        code: 'WH-NORTH',
        address: { street: '12 Ring Road Industrial Zone', city: 'Delhi NCR', state: 'Delhi', zipCode: '110001' },
        manager: 'Priya Sharma',
        phone: '+91 11 3344 5566',
        email: 'north.hub@stockpulse.local',
        capacity: 18000,
        status: 'active',
      },
    ]);

    console.log('Seeding Categories...');
    const categories = await Category.insertMany([
      { name: 'Electronics & Hardware', description: 'Smartphones, components, displays, and wiring' },
      { name: 'Industrial & Tools', description: 'Power equipment, machining tools, safety fixtures' },
      { name: 'Office Supplies', description: 'Stationery, paper goods, desk ergonomics' },
      { name: 'Packaging & Logistics', description: 'Cartons, bubble mailers, pallet wrapping tapes' },
      { name: 'Food & Gourmet Beverages', description: 'Consumables, coffee beans, confectionery' },
      { name: 'Health & Safety Gear', description: 'PPE equipment, sanitizers, first aid kits' },
    ]);

    console.log('Seeding Brands...');
    const brands = await Brand.insertMany([
      { name: 'ApexTech', description: 'High precision electronic hardware and boards' },
      { name: 'OmniGear', description: 'Heavy duty workshop and electrical machinery' },
      { name: 'PrimeSteel', description: 'Industrial racking, metal fixtures and fasteners' },
      { name: 'PurePack', description: 'Biodegradable packaging and shipping supplies' },
      { name: 'AromaCraft', description: 'Artisanal roasts and culinary consumables' },
      { name: 'SafeShield', description: 'Industrial grade safety helmets, masks, and vests' },
    ]);

    console.log('Seeding Suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        name: 'Rajesh Singhania',
        companyName: 'TechSupply Matrix Corp',
        email: 'orders@techsupplymatrix.com',
        phone: '+91 98200 11223',
        address: { street: 'Sector 5, Electronics City', city: 'Bangalore', state: 'Karnataka', zipCode: '560100' },
        gstNumber: '29AABCT1334F1Z1',
        paymentTerms: 'Net 30',
        openingBalance: 15000,
        currentBalance: 32000,
      },
      {
        name: 'Marcus Vance',
        companyName: 'Global Tools & Hardware Ltd',
        email: 'supply@globalhardware.org',
        phone: '+91 98200 44556',
        address: { street: 'MIDC Industrial Estate', city: 'Pune', state: 'Maharashtra', zipCode: '411018' },
        gstNumber: '27AABCG9876E1Z9',
        paymentTerms: 'Net 45',
        openingBalance: 0,
        currentBalance: 12500,
      },
      {
        name: 'Kavita Chawla',
        companyName: 'Precision Packaging Industries',
        email: 'sales@precisionpack.in',
        phone: '+91 98200 77889',
        address: { street: '88 Okhla Phase III', city: 'New Delhi', state: 'Delhi', zipCode: '110020' },
        gstNumber: '07AABCP5432D1Z3',
        paymentTerms: 'Net 15',
        openingBalance: 5000,
        currentBalance: 5000,
      },
      {
        name: 'Suresh Nambiar',
        companyName: 'Highland Specialty Commodities',
        email: 'b2b@highlandcommodities.com',
        phone: '+91 98200 99001',
        address: { street: 'Plantation Road, Willingdon Island', city: 'Kochi', state: 'Kerala', zipCode: '682003' },
        gstNumber: '32AABCH1212B1Z8',
        paymentTerms: 'Immediate',
        openingBalance: 0,
        currentBalance: 0,
      },
    ]);

    console.log('Seeding Customers...');
    const customers = await Customer.insertMany([
      {
        name: 'Acme Retail Chains',
        email: 'procurement@acmeretail.com',
        phone: '+91 99001 22334',
        address: { street: '400 Commercial Boulevard', city: 'Bangalore', state: 'Karnataka', zipCode: '560001' },
        gstNumber: '29AACCA1122C1Z4',
        creditLimit: 250000,
        openingBalance: 0,
        currentBalance: 24500,
      },
      {
        name: 'Horizon Mart Superstores',
        email: 'accounts@horizonmart.com',
        phone: '+91 99001 55667',
        address: { street: 'Level 2, Galaxy Mall', city: 'Mumbai', state: 'Maharashtra', zipCode: '400050' },
        gstNumber: '27AACCH3344D1Z2',
        creditLimit: 500000,
        openingBalance: 10000,
        currentBalance: 68000,
      },
      {
        name: 'Star Supermarket Group',
        email: 'billing@starsupermarkets.in',
        phone: '+91 99001 88990',
        address: { street: 'Sector 18 Commercial Hub', city: 'Noida', state: 'Uttar Pradesh', zipCode: '201301' },
        gstNumber: '09AACCS7788K1Z5',
        creditLimit: 150000,
        openingBalance: 0,
        currentBalance: 0,
      },
      {
        name: 'BlueWave Enterprise Facilities',
        email: 'ops@bluewave-facilities.com',
        phone: '+91 99002 11223',
        address: { street: 'Cyber Gateway IT Hub', city: 'Hyderabad', state: 'Telangana', zipCode: '500081' },
        gstNumber: '36AACCB9900M1Z7',
        creditLimit: 300000,
        openingBalance: 15000,
        currentBalance: 15000,
      },
    ]);

    console.log('Seeding Products with Realistic SKU & Inventory Data...');
    const now = new Date();
    const expDateSoon = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000); // 12 days left
    const expDateNextYear = new Date(now.getTime() + 380 * 24 * 60 * 60 * 1000);
    const expDatePast = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // expired 5 days ago

    const products = await Product.insertMany([
      {
        name: 'Wireless Ergonomic Mechanical Keyboard',
        sku: 'KB-APEX-01',
        barcode: '890123456001',
        category: categories[0]._id,
        brand: brands[0]._id,
        supplier: suppliers[0]._id,
        warehouse: warehouses[0]._id,
        rack: 'R1-A',
        shelf: 'S3',
        purchasePrice: 2200,
        sellingPrice: 3800,
        discount: 5,
        taxRate: 18,
        unit: 'pcs',
        currentStock: 120,
        minStock: 25,
        maxStock: 300,
        reorderLevel: 35,
        batchNumber: 'B-2026-KB01',
        mfgDate: new Date('2026-01-15'),
        expiryDate: expDateNextYear,
        status: 'active',
        leadTimeDays: 7,
      },
      {
        name: 'Pro Ultra HD 4K Conference Webcam',
        sku: 'CAM-APEX-02',
        barcode: '890123456002',
        category: categories[0]._id,
        brand: brands[0]._id,
        supplier: suppliers[0]._id,
        warehouse: warehouses[0]._id,
        rack: 'R1-B',
        shelf: 'S2',
        purchasePrice: 4500,
        sellingPrice: 7200,
        discount: 0,
        taxRate: 18,
        unit: 'pcs',
        currentStock: 8, // Low Stock!
        minStock: 15,
        maxStock: 80,
        reorderLevel: 20,
        batchNumber: 'B-2026-CAM02',
        mfgDate: new Date('2026-02-10'),
        expiryDate: expDateNextYear,
        status: 'active',
        leadTimeDays: 10,
      },
      {
        name: 'USB-C Multiport Thunderbolt Hub 10-in-1',
        sku: 'HUB-APEX-03',
        barcode: '890123456003',
        category: categories[0]._id,
        brand: brands[0]._id,
        supplier: suppliers[0]._id,
        warehouse: warehouses[1]._id,
        rack: 'R2-A',
        shelf: 'S1',
        purchasePrice: 1800,
        sellingPrice: 2999,
        discount: 10,
        taxRate: 18,
        unit: 'pcs',
        currentStock: 0, // Out of Stock!
        minStock: 20,
        maxStock: 200,
        reorderLevel: 25,
        batchNumber: 'B-2026-HUB03',
        mfgDate: new Date('2026-03-01'),
        expiryDate: expDateNextYear,
        status: 'active',
        leadTimeDays: 6,
      },
      {
        name: 'Heavy Duty Cordless Rotary Hammer Drill 20V',
        sku: 'TOOL-OMNI-01',
        barcode: '890123456004',
        category: categories[1]._id,
        brand: brands[1]._id,
        supplier: suppliers[1]._id,
        warehouse: warehouses[1]._id,
        rack: 'R3-C',
        shelf: 'S4',
        purchasePrice: 5800,
        sellingPrice: 9400,
        discount: 0,
        taxRate: 18,
        unit: 'pcs',
        currentStock: 45,
        minStock: 10,
        maxStock: 100,
        reorderLevel: 15,
        batchNumber: 'B-2026-DRL01',
        mfgDate: new Date('2026-01-20'),
        expiryDate: expDateNextYear,
        status: 'active',
        leadTimeDays: 14,
      },
      {
        name: 'Precision Digital Laser Distance Meter 60M',
        sku: 'TOOL-OMNI-02',
        barcode: '890123456005',
        category: categories[1]._id,
        brand: brands[1]._id,
        supplier: suppliers[1]._id,
        warehouse: warehouses[1]._id,
        rack: 'R3-D',
        shelf: 'S2',
        purchasePrice: 1600,
        sellingPrice: 2850,
        discount: 5,
        taxRate: 18,
        unit: 'pcs',
        currentStock: 12, // Low stock!
        minStock: 15,
        maxStock: 120,
        reorderLevel: 20,
        batchNumber: 'B-2026-LDM02',
        mfgDate: new Date('2026-02-15'),
        expiryDate: expDateNextYear,
        status: 'active',
        leadTimeDays: 8,
      },
      {
        name: 'Industrial Corrugated Packing Boxes 5-Ply (Set of 25)',
        sku: 'BOX-PURE-01',
        barcode: '890123456006',
        category: categories[3]._id,
        brand: brands[3]._id,
        supplier: suppliers[2]._id,
        warehouse: warehouses[0]._id,
        rack: 'R4-A',
        shelf: 'S1',
        purchasePrice: 650,
        sellingPrice: 1150,
        discount: 0,
        taxRate: 12,
        unit: 'box',
        currentStock: 350,
        minStock: 50,
        maxStock: 800,
        reorderLevel: 80,
        batchNumber: 'B-2026-BOX01',
        mfgDate: new Date('2026-03-01'),
        expiryDate: expDateNextYear,
        status: 'active',
        leadTimeDays: 4,
      },
      {
        name: 'Heavy Duty Thermal Shipping Label Rolls 4x6 (Pack of 4)',
        sku: 'LBL-PURE-02',
        barcode: '890123456007',
        category: categories[3]._id,
        brand: brands[3]._id,
        supplier: suppliers[2]._id,
        warehouse: warehouses[0]._id,
        rack: 'R4-B',
        shelf: 'S3',
        purchasePrice: 420,
        sellingPrice: 790,
        discount: 5,
        taxRate: 12,
        unit: 'pack',
        currentStock: 180,
        minStock: 30,
        maxStock: 400,
        reorderLevel: 45,
        batchNumber: 'B-2026-LBL02',
        mfgDate: new Date('2026-02-18'),
        expiryDate: expDateNextYear,
        status: 'active',
        leadTimeDays: 5,
      },
      {
        name: 'Single Origin Arabica Dark Roast Coffee Beans 1KG',
        sku: 'FOOD-AROMA-01',
        barcode: '890123456008',
        category: categories[4]._id,
        brand: brands[4]._id,
        supplier: suppliers[3]._id,
        warehouse: warehouses[2]._id,
        rack: 'R5-A',
        shelf: 'S2',
        purchasePrice: 780,
        sellingPrice: 1350,
        discount: 0,
        taxRate: 5,
        unit: 'kg',
        currentStock: 95,
        minStock: 25,
        maxStock: 250,
        reorderLevel: 40,
        batchNumber: 'B-2026-COF01',
        mfgDate: new Date('2026-03-10'),
        expiryDate: expDateSoon, // Expiring soon in 12 days!
        status: 'active',
        leadTimeDays: 5,
      },
      {
        name: 'Organic Matcha Green Tea Ceremonial Grade 250G',
        sku: 'FOOD-AROMA-02',
        barcode: '890123456009',
        category: categories[4]._id,
        brand: brands[4]._id,
        supplier: suppliers[3]._id,
        warehouse: warehouses[2]._id,
        rack: 'R5-B',
        shelf: 'S1',
        purchasePrice: 950,
        sellingPrice: 1690,
        discount: 0,
        taxRate: 5,
        unit: 'box',
        currentStock: 30,
        minStock: 10,
        maxStock: 100,
        reorderLevel: 15,
        batchNumber: 'B-2025-TEA02',
        mfgDate: new Date('2025-06-01'),
        expiryDate: expDatePast, // Expired!
        status: 'active',
        leadTimeDays: 7,
      },
      {
        name: 'ANSI Z87.1 Certified Anti-Fog Safety Goggles',
        sku: 'SAFE-SHIELD-01',
        barcode: '890123456010',
        category: categories[5]._id,
        brand: brands[5]._id,
        supplier: suppliers[1]._id,
        warehouse: warehouses[1]._id,
        rack: 'R6-A',
        shelf: 'S4',
        purchasePrice: 190,
        sellingPrice: 420,
        discount: 0,
        taxRate: 18,
        unit: 'pcs',
        currentStock: 210,
        minStock: 40,
        maxStock: 500,
        reorderLevel: 60,
        batchNumber: 'B-2026-SAF01',
        mfgDate: new Date('2026-01-05'),
        expiryDate: expDateNextYear,
        status: 'active',
        leadTimeDays: 6,
      },
      {
        name: 'Automatic Sanitizer Dispenser Wall Mount 1000ml',
        sku: 'SAFE-SHIELD-02',
        barcode: '890123456011',
        category: categories[5]._id,
        brand: brands[5]._id,
        supplier: suppliers[1]._id,
        warehouse: warehouses[2]._id,
        rack: 'R6-B',
        shelf: 'S1',
        purchasePrice: 750,
        sellingPrice: 1450,
        discount: 0,
        taxRate: 18,
        unit: 'pcs',
        currentStock: 65,
        minStock: 15,
        maxStock: 150,
        reorderLevel: 25,
        batchNumber: 'B-2026-SAF02',
        mfgDate: new Date('2026-02-12'),
        expiryDate: expDateNextYear,
        status: 'active',
        leadTimeDays: 8,
      },
    ]);

    console.log('Seeding Initial Stock Movements...');
    for (const prod of products) {
      if (prod.currentStock > 0) {
        await StockMovement.create({
          product: prod._id,
          warehouse: prod.warehouse,
          type: 'IN',
          quantity: prod.currentStock,
          previousStock: 0,
          newStock: prod.currentStock,
          unitCost: prod.purchasePrice,
          referenceType: 'Opening Stock',
          reason: 'Initial Inventory Ingestion',
          user: adminUser._id,
        });
      }
    }

    console.log('Seeding Historical & Recent Purchases...');
    const p1 = await Purchase.create({
      purchaseNumber: 'PO-1001',
      supplier: suppliers[0]._id,
      warehouse: warehouses[0]._id,
      items: [
        {
          product: products[0]._id,
          productName: products[0].name,
          sku: products[0].sku,
          quantity: 50,
          unitCost: products[0].purchasePrice,
          taxRate: 18,
          discount: 0,
          subtotal: 50 * products[0].purchasePrice * 1.18,
        },
      ],
      subtotal: 50 * products[0].purchasePrice,
      discountTotal: 0,
      taxTotal: 50 * products[0].purchasePrice * 0.18,
      shippingCost: 1500,
      grandTotal: 50 * products[0].purchasePrice * 1.18 + 1500,
      paidAmount: 50 * products[0].purchasePrice * 1.18 + 1500,
      paymentStatus: 'paid',
      orderStatus: 'received',
      notes: 'Delivered in good condition',
      user: managerUser._id,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    });

    const p2 = await Purchase.create({
      purchaseNumber: 'PO-1002',
      supplier: suppliers[1]._id,
      warehouse: warehouses[1]._id,
      items: [
        {
          product: products[3]._id,
          productName: products[3].name,
          sku: products[3].sku,
          quantity: 20,
          unitCost: products[3].purchasePrice,
          taxRate: 18,
          discount: 5,
          subtotal: 20 * products[3].purchasePrice * 0.95 * 1.18,
        },
      ],
      subtotal: 20 * products[3].purchasePrice,
      discountTotal: 20 * products[3].purchasePrice * 0.05,
      taxTotal: 20 * products[3].purchasePrice * 0.95 * 0.18,
      shippingCost: 2000,
      grandTotal: 20 * products[3].purchasePrice * 0.95 * 1.18 + 2000,
      paidAmount: 50000,
      paymentStatus: 'partial',
      orderStatus: 'ordered',
      notes: 'Pending delivery from Pune facility',
      user: adminUser._id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    console.log('Seeding Historical & Recent Sales (POS & Invoices)...');
    // Sale 1
    const s1Items = [
      {
        product: products[0]._id,
        productName: products[0].name,
        sku: products[0].sku,
        quantity: 5,
        unitPrice: products[0].sellingPrice,
        purchaseCost: products[0].purchasePrice,
        discount: 5,
        taxRate: 18,
        subtotal: 5 * products[0].sellingPrice * 0.95 * 1.18,
      },
      {
        name: products[5].name,
        product: products[5]._id,
        productName: products[5].name,
        sku: products[5].sku,
        quantity: 10,
        unitPrice: products[5].sellingPrice,
        purchaseCost: products[5].purchasePrice,
        discount: 0,
        taxRate: 12,
        subtotal: 10 * products[5].sellingPrice * 1.12,
      },
    ];
    const s1GrandTotal = Math.round(s1Items[0].subtotal + s1Items[1].subtotal);

    const sale1 = await Sale.create({
      invoiceNumber: 'INV-1001',
      customer: customers[0]._id,
      customerName: customers[0].name,
      customerPhone: customers[0].phone,
      items: s1Items,
      subtotal: 5 * products[0].sellingPrice + 10 * products[5].sellingPrice,
      discountTotal: 5 * products[0].sellingPrice * 0.05,
      taxTotal: Math.round(s1Items[0].subtotal + s1Items[1].subtotal - (5 * products[0].sellingPrice * 0.95 + 10 * products[5].sellingPrice)),
      grandTotal: s1GrandTotal,
      paidAmount: s1GrandTotal,
      changeAmount: 0,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      saleStatus: 'completed',
      notes: 'Bulk corporate order',
      user: staffUser._id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    await Invoice.create({
      invoiceNumber: 'INV-1001',
      sale: sale1._id,
      customer: {
        id: customers[0]._id,
        name: customers[0].name,
        phone: customers[0].phone,
        email: customers[0].email,
        address: customers[0].address?.street,
        gstNumber: customers[0].gstNumber,
      },
      items: s1Items.map((i) => ({
        product: i.product,
        name: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxRate: i.taxRate,
        subtotal: i.subtotal,
      })),
      subtotal: sale1.subtotal,
      discountTotal: sale1.discountTotal,
      taxTotal: sale1.taxTotal,
      grandTotal: s1GrandTotal,
      paidAmount: s1GrandTotal,
      dueAmount: 0,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      notes: 'Thank you for choosing StockPulse!',
      createdAt: sale1.createdAt,
    });

    // Sale 2 (Recent today)
    const s2Items = [
      {
        product: products[7]._id,
        productName: products[7].name,
        sku: products[7].sku,
        quantity: 4,
        unitPrice: products[7].sellingPrice,
        purchaseCost: products[7].purchasePrice,
        discount: 0,
        taxRate: 5,
        subtotal: 4 * products[7].sellingPrice * 1.05,
      },
      {
        product: products[9]._id,
        productName: products[9].name,
        sku: products[9].sku,
        quantity: 8,
        unitPrice: products[9].sellingPrice,
        purchaseCost: products[9].purchasePrice,
        discount: 0,
        taxRate: 18,
        subtotal: 8 * products[9].sellingPrice * 1.18,
      },
    ];
    const s2GrandTotal = Math.round(s2Items[0].subtotal + s2Items[1].subtotal);

    const sale2 = await Sale.create({
      invoiceNumber: 'INV-1002',
      customer: customers[1]._id,
      customerName: customers[1].name,
      customerPhone: customers[1].phone,
      items: s2Items,
      subtotal: 4 * products[7].sellingPrice + 8 * products[9].sellingPrice,
      discountTotal: 0,
      taxTotal: s2GrandTotal - (4 * products[7].sellingPrice + 8 * products[9].sellingPrice),
      grandTotal: s2GrandTotal,
      paidAmount: s2GrandTotal,
      changeAmount: 0,
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      saleStatus: 'completed',
      notes: 'Counter POS checkout via UPI QR',
      user: staffUser._id,
      createdAt: new Date(),
    });

    await Invoice.create({
      invoiceNumber: 'INV-1002',
      sale: sale2._id,
      customer: {
        id: customers[1]._id,
        name: customers[1].name,
        phone: customers[1].phone,
        email: customers[1].email,
        address: customers[1].address?.street,
        gstNumber: customers[1].gstNumber,
      },
      items: s2Items.map((i) => ({
        product: i.product,
        name: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxRate: i.taxRate,
        subtotal: i.subtotal,
      })),
      subtotal: sale2.subtotal,
      discountTotal: 0,
      taxTotal: sale2.taxTotal,
      grandTotal: s2GrandTotal,
      paidAmount: s2GrandTotal,
      dueAmount: 0,
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      notes: 'Thank you for your business!',
      createdAt: new Date(),
    });

    console.log('Seeding Payments & Receipts...');
    await Payment.insertMany([
      {
        paymentNumber: 'REC-1001',
        type: 'customer_receipt',
        sale: sale1._id,
        customer: customers[0]._id,
        partyName: customers[0].name,
        amount: s1GrandTotal,
        paymentMethod: 'card',
        referenceNumber: 'TXN-99887711',
        notes: 'Full payment for INV-1001',
        paymentDate: sale1.createdAt,
        user: staffUser._id,
      },
      {
        paymentNumber: 'REC-1002',
        type: 'customer_receipt',
        sale: sale2._id,
        customer: customers[1]._id,
        partyName: customers[1].name,
        amount: s2GrandTotal,
        paymentMethod: 'upi',
        referenceNumber: 'UPI-77665544',
        notes: 'UPI payment for INV-1002',
        paymentDate: new Date(),
        user: staffUser._id,
      },
      {
        paymentNumber: 'PAY-1001',
        type: 'supplier_payment',
        purchase: p1._id,
        supplier: suppliers[0]._id,
        partyName: suppliers[0].companyName,
        amount: p1.paidAmount,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'NEFT-55443322',
        notes: 'Vendor payment for PO-1001',
        paymentDate: p1.createdAt,
        user: accountantUser._id,
      },
    ]);

    console.log('Seeding Expenses...');
    await Expense.insertMany([
      {
        expenseNumber: 'EXP-1001',
        title: 'Central Warehouse Monthly Lease',
        category: 'Rent',
        amount: 85000,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        paymentMethod: 'bank_transfer',
        description: 'Monthly facility lease for Central Hub Alpha',
        user: accountantUser._id,
      },
      {
        expenseNumber: 'EXP-1002',
        title: 'Electricity & High-Load Grid Power',
        category: 'Electricity',
        amount: 14200,
        date: new Date(now.getFullYear(), now.getMonth(), 3),
        paymentMethod: 'bank_transfer',
        description: 'Industrial power consumption billing',
        user: accountantUser._id,
      },
      {
        expenseNumber: 'EXP-1003',
        title: 'Staff Logistics & Courier Deliveries',
        category: 'Transport',
        amount: 8900,
        date: new Date(now.getFullYear(), now.getMonth(), 8),
        paymentMethod: 'cash',
        description: 'Local dispatch van fueling & highway tolls',
        user: managerUser._id,
      },
      {
        expenseNumber: 'EXP-1004',
        title: 'Forklift Hydraulic Maintenance & Inspection',
        category: 'Maintenance',
        amount: 6500,
        date: new Date(now.getFullYear(), now.getMonth(), 14),
        paymentMethod: 'cheque',
        description: 'Quarterly servicing of warehouse lifting machinery',
        user: managerUser._id,
      },
      {
        expenseNumber: 'EXP-1005',
        title: 'Digital Marketing & B2B Google Ads Campaign',
        category: 'Marketing',
        amount: 18000,
        date: new Date(now.getFullYear(), now.getMonth(), 18),
        paymentMethod: 'card',
        description: 'Acquisition campaign for enterprise retail distributors',
        user: adminUser._id,
      },
    ]);

    console.log('Seeding Notifications...');
    await Notification.insertMany([
      {
        title: 'Critical Out of Stock',
        message: 'Product "USB-C Multiport Thunderbolt Hub 10-in-1" (SKU: HUB-APEX-03) has 0 units in stock!',
        type: 'out_of_stock',
        priority: 'urgent',
        isRead: false,
        link: '/inventory/products',
      },
      {
        title: 'Low Stock Alert',
        message: 'Product "Pro Ultra HD 4K Conference Webcam" has only 8 units left (Min threshold: 15).',
        type: 'low_stock',
        priority: 'high',
        isRead: false,
        link: '/inventory/low-stock',
      },
      {
        title: 'Product Expiring Soon',
        message: 'Batch B-2026-COF01 of "Single Origin Arabica Dark Roast Coffee Beans 1KG" will expire in 12 days.',
        type: 'expiring',
        priority: 'high',
        isRead: false,
        link: '/inventory/expiry',
      },
      {
        title: 'Batch Expired',
        message: 'Batch B-2025-TEA02 of "Organic Matcha Green Tea Ceremonial Grade 250G" expired 5 days ago.',
        type: 'expired',
        priority: 'urgent',
        isRead: true,
        link: '/inventory/expiry',
      },
      {
        title: 'New POS Invoice Completed',
        message: 'Invoice INV-1002 was generated for ₹9,634 via UPI by David Miller.',
        type: 'sale',
        priority: 'medium',
        isRead: true,
        link: '/sales/invoices',
      },
    ]);

    console.log('Seeding Audit Trail Logs...');
    await AuditLog.insertMany([
      {
        user: adminUser._id,
        userName: adminUser.name,
        userRole: 'admin',
        action: 'CREATE',
        module: 'Product',
        details: 'Initial master catalog ingestion for 11 stock products',
        ipAddress: '127.0.0.1',
      },
      {
        user: managerUser._id,
        userName: managerUser.name,
        userRole: 'manager',
        action: 'CREATE',
        module: 'Purchase',
        details: 'Issued Purchase Order PO-1001 for TechSupply Matrix Corp',
        ipAddress: '127.0.0.1',
      },
      {
        user: staffUser._id,
        userName: staffUser.name,
        userRole: 'staff',
        action: 'CREATE',
        module: 'Sale',
        details: 'Completed POS sale transaction INV-1002 for ₹9,634',
        ipAddress: '127.0.0.1',
      },
      {
        user: accountantUser._id,
        userName: accountantUser.name,
        userRole: 'accountant',
        action: 'CREATE',
        module: 'Expense',
        details: 'Recorded monthly facility rent payment of ₹85,000',
        ipAddress: '127.0.0.1',
      },
    ]);

    console.log('\n======================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Admin:       admin@inventory.com       / Admin@123');
    console.log('Manager:     manager@inventory.com     / Manager@123');
    console.log('Staff:       staff@inventory.com       / Staff@123');
    console.log('Accountant:  accountant@inventory.com  / Accountant@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
