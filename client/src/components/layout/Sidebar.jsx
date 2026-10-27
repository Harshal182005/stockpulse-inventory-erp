import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  Layers,
  Archive,
  ArrowLeftRight,
  Warehouse,
  AlertTriangle,
  Clock,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  PieChart,
  BrainCircuit,
  Sparkles,
  Bell,
  Shield,
  History,
  Settings,
  ChevronDown,
  UserCheck,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  // Navigation sections structure
  const navSections = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Inventory',
      items: [
        { name: 'Products', path: '/inventory/products', icon: Package },
        { name: 'Categories', path: '/inventory/categories', icon: Tags },
        { name: 'Brands', path: '/inventory/brands', icon: Layers },
        { name: 'Stock Overview', path: '/inventory/stock', icon: Archive },
        { name: 'Stock Movements', path: '/inventory/movements', icon: ArrowLeftRight },
        { name: 'Warehouses', path: '/inventory/warehouses', icon: Warehouse },
        { name: 'Low Stock Alerts', path: '/inventory/low-stock', icon: AlertTriangle, badge: 'Alert' },
        { name: 'Expiry Tracking', path: '/inventory/expiry', icon: Clock },
      ],
    },
    {
      title: 'Sales & POS',
      items: [
        { name: 'POS Terminal', path: '/sales/pos', icon: ShoppingCart, highlight: true },
        { name: 'Sales Orders', path: '/sales/orders', icon: Receipt },
        { name: 'Sales Returns', path: '/sales/returns', icon: RotateCcw },
        { name: 'Customers', path: '/sales/customers', icon: Users },
        { name: 'Invoices', path: '/sales/invoices', icon: Receipt },
        { name: 'Payments', path: '/sales/payments', icon: CreditCard },
      ],
    },
    {
      title: 'Purchases',
      items: [
        { name: 'Purchase Orders', path: '/purchases/orders', icon: ShoppingCart },
        { name: 'Purchase Returns', path: '/purchases/returns', icon: RotateCcw },
        { name: 'Suppliers', path: '/purchases/suppliers', icon: Users },
      ],
    },
    {
      title: 'Finance',
      items: [
        { name: 'Expenses', path: '/finance/expenses', icon: DollarSign },
        { name: 'Profit & Loss', path: '/finance/profit-loss', icon: TrendingUp },
        { name: 'Financial Reports', path: '/finance/reports', icon: PieChart },
      ],
    },
    {
      title: 'AI Intelligence',
      items: [
        { name: 'Demand Forecast', path: '/analytics/forecast', icon: BrainCircuit, badge: 'AI' },
        { name: 'Recommendations', path: '/analytics/recommendations', icon: Sparkles, badge: 'Smart' },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Notifications', path: '/system/notifications', icon: Bell },
        { name: 'Users Management', path: '/system/users', icon: UserCheck, roles: ['admin'] },
        { name: 'Roles & Permissions', path: '/system/roles', icon: Shield, roles: ['admin'] },
        { name: 'Audit Logs', path: '/system/audit-logs', icon: History, roles: ['admin'] },
        { name: 'Settings', path: '/system/settings', icon: Settings, roles: ['admin'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-xl`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <NavLink to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight flex items-center">
                Stock<span className="text-indigo-400">Pulse</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase block -mt-1">
                Enterprise ERP
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => {
            const filteredItems = section.items.filter((item) => {
              if (!item.roles) return true;
              return item.roles.includes(user?.role);
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={idx}>
                <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {filteredItems.map((item, itemIdx) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={itemIdx}
                        to={item.path}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }) =>
                          `group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                              : item.highlight
                              ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/60'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`
                        }
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              item.badge === 'AI'
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                : item.badge === 'Alert'
                                ? 'bg-rose-500 text-white'
                                : 'bg-indigo-500 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Card at Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3 px-2 py-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 truncate">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
