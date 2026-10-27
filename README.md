# StockPulse ERP - Enterprise Inventory Management System

A production-ready, full-featured **Inventory Management System (StockPulse ERP)** built with the **MERN Stack** (MongoDB, Express.js, React, Node.js), Tailwind CSS, Recharts, and automated inventory intelligence.

Designed to handle real-world wholesale, retail, and multi-warehouse operations with complete role-based access control, barcode scanning, POS terminal, dynamic reporting, PDF invoicing, batch expiration alerts, and predictive demand analytics.

---

## 🌟 Key Highlights & Modules

### 1. 🔐 Role-Based Access Control (RBAC)
- 4 Pre-configured Business Personas:
  - **Admin**: Universal system access, user management, role permissions matrix, audit logs, system-wide settings.
  - **Manager**: Product catalog, warehouses, stock adjustments, vendor purchases, inventory alerts, and operations.
  - **Staff**: Point of Sale (POS) checkout, customer management, instant billing, receipt printing.
  - **Accountant**: Invoices, customer receivables, supplier payouts, operating expenses, financial reports & P&L statements.
- Secure JWT authentication, bcrypt password hashing, profile management, and password reset flows.

### 2. 📊 Executive Dashboard & Real-Time Analytics
- **14 Essential KPIs**:
  - Total Products, Categories, Suppliers, Customers.
  - Total Stock Valuation (Cost vs. Retail value).
  - Today's Sales, Monthly Revenue, Gross Profit, Pending Receivables.
  - Low Stock, Out-of-Stock, Expiring Soon, and Expired products.
- **Interactive Visualizations (Recharts)**:
  - 30-Day Sales & Expense Telemetry (Area Chart).
  - Category-Wise Stock Distribution (Bar Chart).
  - Payment Method Share (Donut Pie Chart: Cash, UPI, Card, Bank Transfer).
  - Top 5 Velocity Selling Products.
- **Dynamic Date Filtering**: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, or Custom Date Range.

### 3. 📦 Complete Product & Catalog Lifecycle
- Comprehensive fields: SKU, Barcode, QR Code, Name, Category, Brand, Supplier, Purchase/Selling Price, GST Tax %, Reorder Level, Expiry Date, Batch Number, Warehouse location, and Rack/Shelf coordinate.
- Auto-generation of Code-128 barcodes and 2D QR codes with single-click label sheet printing.
- Bulk product import (CSV parser) and export to CSV.
- Stock audit history tracking every movement per SKU.

### 4. 🏬 Multi-Warehouse & Inventory Management
- Multiple warehouse facilities with dynamic storage capacity meters.
- Stock movements: **Stock In**, **Stock Out**, **Physical Adjustment**, and **Inter-Warehouse Transfers**.
- Batch tracking with automated expiration countdowns (Expired, Expiring in 7 Days, Expiring in 30 Days, Safe).
- Low-stock threshold alerts with one-click purchase order requisition generation.

### 5. 🛒 High-Velocity POS Terminal & Sales Management
- Ultra-fast Point of Sale terminal designed for touchscreens and desktop barcode scanners.
- Instant item search by SKU, barcode, or product name.
- Hold & Resume sales queue for handling multiple walk-in shoppers.
- Real-time cart calculations: subtotal, item discount, overall coupon discount %, GST computation, and net payable.
- Multi-channel payment split (Cash, UPI, Credit/Debit Card, Bank Transfer, Net Banking).
- One-click PDF thermal receipt and tax invoice generation via `jsPDF`.
- Sales returns workflow with restocking and inventory restoration.

### 6. 💼 Vendor Purchases & Purchase Returns
- Supplier database with GSTIN, ledger, credit limits, and purchase history.
- Purchase Order (PO) creation with multiple line items, tax, and shipping status.
- Goods Receipt workflow: Marking a PO as "Received" automatically increments stock across assigned warehouses.
- Vendor purchase returns with refund tracking and inventory reconciliation.

### 7. 📄 Invoicing, Payments & Operating Expenses
- Compliant GST tax invoice PDF generator with corporate branding, customer details, itemized tax breakdowns, and payment QR codes.
- Complete Accounts Receivable (customer payments) & Accounts Payable (vendor disbursements) ledger.
- Operating expense tracking (Rent, Electricity, Payroll, Logistics, Maintenance, Marketing) integrated into net profit calculation.

### 8. 🤖 AI Demand Forecasting & Smart Recommendations
- **Sales Velocity Algorithm**: Calculates average daily burn rate, lead time buffers, and runout projections (estimated days until stock-out).
- **Demand Forecasting**: 7-day, 30-day, and 90-day future demand projections visualized with historical vs. forecast trendlines.
- **Prescriptive Recommendations Engine**:
  - Highlights declining sales velocity to prevent overstocking.
  - Flags batches expiring before expected sell-through date.
  - Suggests optimal reorder dates and quantities based on supplier lead times.

### 9. 🔔 Centralized Notifications & Enterprise Auditing
- Unread badge counter and real-time alerts for low stock, expiring goods, and overdue payments.
- Comprehensive immutable system audit log capturing user ID, IP address, HTTP method, module, and detailed action summary for full governance.

---

## 🛠️ Tech Stack Architecture

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6, Tailwind CSS, Recharts, Lucide React, jsPDF, jspdf-autotable, JsBarcode, QRCode.react, React Hot Toast, Axios |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JSON Web Tokens (JWT), Bcrypt.js, Multer, Nodemailer, Morgan, Helmet, CORS |
| **Database** | MongoDB (Document Database) |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI)

---

### Step 1: Backend Setup & Seeding

1. Open your terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Review the environment configuration in `.env` (pre-configured for standard local execution):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/inventory_db
   JWT_SECRET=stockpulse_super_secret_jwt_key_2026_enterprise_production
   JWT_EXPIRE=30d
   ```

4. **Seed the database with sample business data**:
   ```bash
   node scripts/seed.js
   ```
   > This generates demo users, warehouses, categories, brands, suppliers, customers, stocked items, purchase orders, sales transactions, expense entries, notifications, and audit records.

5. Start the backend server:
   ```bash
   npm run dev
   # Or for production: node server.js
   ```
   *The Express server will start on `http://localhost:5000`.*

---

### Step 2: Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will start on `http://localhost:5173`.*

---

## 🔑 Demo Login Credentials

The seed script pre-populates 4 user personas. You can use the **1-Click Quick Fill** buttons on the `/login` page or log in manually with the following accounts:

| Role | Email Address | Password | Permissions Scope |
|---|---|---|---|
| **Admin** | `admin@inventory.com` | `Admin@123` | Full access across all modules, settings, users, and audit logs |
| **Manager** | `manager@inventory.com` | `Manager@123` | Products, Stock Adjustments, Warehouses, Purchases, AI Analytics |
| **Staff** | `staff@inventory.com` | `Staff@123` | POS Terminal, Sales, Customers, Invoice Receipts |
| **Accountant** | `accountant@inventory.com` | `Accountant@123` | Invoices, Customer Payments, Vendor Payouts, Expenses, P&L Reports |

---

## 📁 Project Directory Structure

```
inventory-management/
├── client/                     # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios instance & token interceptors
│   │   ├── components/
│   │   │   ├── barcode/        # Barcode & QR viewer + printable label sheets
│   │   │   ├── common/         # StatCard, Modal, Badge, Pagination, Global Search
│   │   │   └── layout/         # Responsive Sidebar, Navbar, PageHeader, Layout
│   │   ├── context/            # AuthContext, ThemeContext, NotificationContext
│   │   ├── pages/
│   │   │   ├── ai/             # Demand Forecasting & Recommendations
│   │   │   ├── audit/          # System Audit Log viewer
│   │   │   ├── auth/           # Login, Register, Forgot/Reset Password
│   │   │   ├── brands/         # Brand Management
│   │   │   ├── categories/     # Category Management
│   │   │   ├── customers/      # Customer directory & transaction ledger
│   │   │   ├── dashboard/      # Executive KPI & Recharts Dashboard
│   │   │   ├── expenses/       # Operating expense records
│   │   │   ├── inventory/      # Stock List, Adjustments, Movements, Low Stock, Expiry
│   │   │   ├── invoices/       # Sales Invoices & PDF generation
│   │   │   ├── notifications/  # Notification center
│   │   │   ├── payments/       # Cash Flow & Payment Vouchers
│   │   │   ├── products/       # Product Catalog, CRUD, detail view
│   │   │   ├── purchases/      # Purchase Orders, PO details, Vendor Returns
│   │   │   ├── reports/        # Profit & Loss, Product Sales Reports
│   │   │   ├── sales/          # High-velocity POS & Sales Order History
│   │   │   ├── settings/       # Organization Profile, Tax defaults, User Profile
│   │   │   ├── suppliers/      # Supplier directory & purchase ledger
│   │   │   ├── users/          # User management & Roles matrix
│   │   │   └── warehouses/     # Multi-warehouse tracking
│   │   ├── utils/              # PDF generator, CSV export, currency/date formatters
│   │   ├── App.jsx             # React Router routing & ProtectedRoute wrappers
│   │   ├── main.jsx            # React root with Context Providers
│   │   └── index.css           # Tailwind CSS directives & custom styling
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                     # Node.js + Express Backend
    ├── config/                 # MongoDB Mongoose connection
    ├── controllers/            # 22 REST API controllers
    ├── middleware/             # Auth JWT, Role RBAC, Error Handler, Multer Upload
    ├── models/                 # 19 Mongoose Schemas
    ├── routes/                 # 22 Express Route definitions
    ├── scripts/
    │   └── seed.js             # Comprehensive database seed script
    ├── services/               # AI forecasting, Stock engine, Audit logger, Email
    ├── .env                    # Environment variables
    └── server.js               # Application entry point & route mounting
```

---

## 📡 REST API Reference Summary

All API endpoints are prefixed with `/api` and require a `Bearer <token>` in the `Authorization` header (except public auth routes).

| Resource | Endpoints | Description |
|---|---|---|
| **Authentication** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/change-password` | User session and profile |
| **Products** | `GET /products`, `POST /products`, `GET /products/:id`, `PUT /products/:id`, `DELETE /products/:id`, `POST /products/bulk-import` | Catalog management |
| **Stock & Movements** | `POST /inventory/adjust`, `POST /inventory/transfer`, `GET /inventory/movements`, `GET /inventory/low-stock`, `GET /inventory/expiring` | Stock operations & audit trail |
| **Sales & POS** | `POST /sales`, `GET /sales`, `GET /sales/:id`, `POST /sales/return` | POS checkout & customer orders |
| **Purchases** | `POST /purchases`, `GET /purchases`, `PUT /purchases/:id/status`, `POST /purchases/return` | POs & vendor receiving |
| **AI Intelligence** | `GET /ai/forecast`, `GET /ai/recommendations` | Sales velocity & predictive stocking |
| **Reports** | `GET /reports/dashboard`, `GET /reports/profit-loss`, `GET /reports/sales-report` | Executive financial analytics |
| **Global Search** | `GET /search?q=<query>` | Instant omni-search (`Ctrl+K`) |

---

## 📄 License
This project is licensed under the MIT License - free for commercial and educational use.
