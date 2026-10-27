import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout & Route Guard
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Products & Catalog
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import ProductDetail from './pages/products/ProductDetail';
import CategoryList from './pages/categories/CategoryList';
import BrandList from './pages/brands/BrandList';

// Entities
import SupplierList from './pages/suppliers/SupplierList';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';

// Inventory & Warehouses
import InventoryList from './pages/inventory/InventoryList';
import StockMovementList from './pages/inventory/StockMovementList';
import LowStockList from './pages/inventory/LowStockList';
import ExpiryList from './pages/inventory/ExpiryList';
import WarehouseList from './pages/warehouses/WarehouseList';

// Purchases
import PurchaseList from './pages/purchases/PurchaseList';
import PurchaseCreate from './pages/purchases/PurchaseCreate';
import PurchaseDetail from './pages/purchases/PurchaseDetail';
import PurchaseReturns from './pages/purchases/PurchaseReturns';

// Sales & POS
import POS from './pages/sales/POS';
import SalesList from './pages/sales/SalesList';
import SaleDetail from './pages/sales/SaleDetail';
import SalesReturns from './pages/sales/SalesReturns';

// Invoices & Financials
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import PaymentList from './pages/payments/PaymentList';
import ExpenseList from './pages/expenses/ExpenseList';

// AI Intelligence
import DemandForecast from './pages/ai/DemandForecast';
import SmartRecommendations from './pages/ai/SmartRecommendations';

// Reports & Analytics
import ReportsHub from './pages/reports/ReportsHub';

// Admin, Settings & System
import NotificationList from './pages/notifications/NotificationList';
import AuditLogList from './pages/audit/AuditLogList';
import UserList from './pages/users/UserList';
import RolesPermissions from './pages/users/RolesPermissions';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #1e293b',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Application Routes inside Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Index & Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* =========================================
              INVENTORY MODULE (Prefixed + Aliases)
             ========================================= */}
          {/* Products */}
          <Route path="inventory/products" element={<ProductList />} />
          <Route
            path="inventory/products/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route path="inventory/products/:id" element={<ProductDetail />} />
          <Route
            path="inventory/products/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          {/* Flat aliases for products */}
          <Route path="products" element={<ProductList />} />
          <Route
            path="products/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route
            path="products/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ProductForm />
              </ProtectedRoute>
            }
          />

          {/* Categories & Brands */}
          <Route path="inventory/categories" element={<CategoryList />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="inventory/brands" element={<BrandList />} />
          <Route path="brands" element={<BrandList />} />

          {/* Stock Overview & Movements */}
          <Route path="inventory/stock" element={<InventoryList />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="inventory/movements" element={<StockMovementList />} />
          <Route path="inventory/warehouses" element={<WarehouseList />} />
          <Route path="warehouses" element={<WarehouseList />} />
          <Route path="inventory/low-stock" element={<LowStockList />} />
          <Route path="inventory/expiry" element={<ExpiryList />} />
          <Route path="inventory/expiring" element={<ExpiryList />} />

          {/* =========================================
              SALES & POS MODULE (Prefixed + Aliases)
             ========================================= */}
          <Route path="sales/pos" element={<POS />} />
          <Route path="pos" element={<POS />} />
          <Route path="sales/orders" element={<SalesList />} />
          <Route path="sales/orders/:id" element={<SaleDetail />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="sales/:id" element={<SaleDetail />} />
          <Route path="sales/returns" element={<SalesReturns />} />

          {/* Customers */}
          <Route path="sales/customers" element={<CustomerList />} />
          <Route path="sales/customers/:id" element={<CustomerDetail />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:id" element={<CustomerDetail />} />

          {/* Invoices & Payments */}
          <Route path="sales/invoices" element={<InvoiceList />} />
          <Route path="sales/invoices/:id" element={<InvoiceDetail />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route
            path="sales/payments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <PaymentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="payments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <PaymentList />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              PURCHASES MODULE (Prefixed + Aliases)
             ========================================= */}
          <Route
            path="purchases/orders"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <PurchaseList />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchases/orders/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <PurchaseCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchases/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <PurchaseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchases"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <PurchaseList />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchases/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <PurchaseCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchases/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <PurchaseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchases/returns"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <PurchaseReturns />
              </ProtectedRoute>
            }
          />

          {/* Suppliers */}
          <Route path="purchases/suppliers" element={<SupplierList />} />
          <Route path="purchases/suppliers/:id" element={<SupplierDetail />} />
          <Route path="suppliers" element={<SupplierList />} />
          <Route path="suppliers/:id" element={<SupplierDetail />} />

          {/* =========================================
              FINANCE & REPORTS (Prefixed + Aliases)
             ========================================= */}
          <Route
            path="finance/expenses"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <ExpenseList />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <ExpenseList />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/profit-loss"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <ReportsHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <ReportsHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']}>
                <ReportsHub />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              AI INTELLIGENCE (Prefixed + Aliases)
             ========================================= */}
          <Route
            path="analytics/forecast"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <DemandForecast />
              </ProtectedRoute>
            }
          />
          <Route
            path="ai/forecast"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <DemandForecast />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics/recommendations"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <SmartRecommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="ai/recommendations"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <SmartRecommendations />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              SYSTEM & SETTINGS (Prefixed + Aliases)
             ========================================= */}
          <Route path="system/notifications" element={<NotificationList />} />
          <Route path="notifications" element={<NotificationList />} />
          <Route
            path="system/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogList />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogList />
              </ProtectedRoute>
            }
          />
          <Route
            path="system/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="system/roles"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RolesPermissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RolesPermissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="system/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="system/profile" element={<ProfilePage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
