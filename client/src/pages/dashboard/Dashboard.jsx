import React, { useState, useEffect } from 'react';
import {
  Package,
  Tags,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShoppingCart,
  Receipt,
  PieChart as PieIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  AlertCircle,
  Truck,
  Plus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('last30days');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/dashboard?period=${period}`);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Page Header with Date Filter Controls */}
      <PageHeader
        title="Executive Inventory Dashboard"
        subtitle="Real-time warehouse tracking, financial telemetry, and AI forecasting"
        actions={
          <div className="flex items-center space-x-2 flex-wrap">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
              <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 pr-3 py-1 focus:outline-none"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
              </select>
            </div>

            <button
              onClick={fetchDashboard}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-xs transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => navigate('/sales/pos')}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Open POS</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards Grid (14 Critical Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard
          title="Total Products"
          value={kpis.totalProducts ?? '-'}
          subtitle="Catalog SKU count"
          icon={Package}
          color="indigo"
          onClick={() => navigate('/inventory/products')}
        />
        <StatCard
          title="Categories"
          value={kpis.totalCategories ?? '-'}
          subtitle="Taxonomies"
          icon={Tags}
          color="purple"
          onClick={() => navigate('/inventory/categories')}
        />
        <StatCard
          title="Suppliers"
          value={kpis.totalSuppliers ?? '-'}
          subtitle="Active vendors"
          icon={Truck}
          color="sky"
          onClick={() => navigate('/purchases/suppliers')}
        />
        <StatCard
          title="Customers"
          value={kpis.totalCustomers ?? '-'}
          subtitle="Registered clients"
          icon={Users}
          color="emerald"
          onClick={() => navigate('/sales/customers')}
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(kpis.totalStockValue || 0)}
          subtitle="Retail valuation"
          icon={DollarSign}
          color="indigo"
          onClick={() => navigate('/inventory/stock')}
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(kpis.todaySales || 0)}
          subtitle="POS & Orders"
          icon={Receipt}
          color="emerald"
          onClick={() => navigate('/sales/orders')}
        />
        <StatCard
          title="Monthly Sales"
          value={formatCurrency(kpis.monthlySales || 0)}
          subtitle="Revenue run rate"
          icon={TrendingUp}
          color="indigo"
          onClick={() => navigate('/sales/orders')}
        />
      </div>

      {/* Secondary KPI Bar: Purchases, Profit, and Critical Alerts */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          title="Period Purchases"
          value={formatCurrency(kpis.totalPurchases || 0)}
          subtitle="Vendor procurement"
          icon={ShoppingCart}
          color="purple"
          onClick={() => navigate('/purchases/orders')}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(kpis.netProfit || 0)}
          subtitle="Rev - COGS - Exp"
          icon={TrendingUp}
          color="emerald"
          onClick={() => navigate('/finance/profit-loss')}
        />
        <StatCard
          title="Pending Due"
          value={formatCurrency(kpis.pendingPayments || 0)}
          subtitle="Receivable credit"
          icon={DollarSign}
          color="amber"
          onClick={() => navigate('/sales/payments')}
        />
        <StatCard
          title="Low Stock"
          value={kpis.lowStockProducts ?? 0}
          subtitle="Below safety level"
          icon={AlertTriangle}
          color="amber"
          onClick={() => navigate('/inventory/low-stock')}
        />
        <StatCard
          title="Out of Stock"
          value={kpis.outOfStockProducts ?? 0}
          subtitle="Immediate restock"
          icon={AlertCircle}
          color="rose"
          onClick={() => navigate('/inventory/products?stockStatus=out_of_stock')}
        />
        <StatCard
          title="Expiring Soon"
          value={kpis.expiringProducts ?? 0}
          subtitle="Within 30 days"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/inventory/expiry')}
        />
        <StatCard
          title="Expired"
          value={kpis.expiredProducts ?? 0}
          subtitle="Scrap / Return"
          icon={AlertCircle}
          color="rose"
          onClick={() => navigate('/inventory/expiry')}
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Purchases & Net Profit (6 Months History) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Fiscal Telemetry (Revenue vs Purchases vs Net Profit)
              </h2>
              <p className="text-xs text-slate-400">
                Track revenue margins against vendor procurement costs
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyTrends || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Payment Method Breakdown
            </h2>
            <p className="text-xs text-slate-400">Share by settlement channel</p>
          </div>
          <div className="h-60 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.paymentMethodData || [{ name: 'Cash', value: 100 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts.paymentMethodData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row: Top Selling Products & Category Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Top Selling Products
              </h2>
              <p className="text-xs text-slate-400">Units sold in current period</p>
            </div>
            <button
              onClick={() => navigate('/sales/orders')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Sales
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.topSellingProducts || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                <Tooltip />
                <Bar dataKey="units" name="Units Sold" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category-wise Stock Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Stock Distribution by Category
              </h2>
              <p className="text-xs text-slate-400">Units currently on warehouse shelves</p>
            </div>
            <button
              onClick={() => navigate('/inventory/categories')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Categories
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categoryStockData || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickFormatter={(str) => str.slice(0, 10)} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="stock" name="Total Units" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Low-Stock & Expiry Quick Actions Banner */}
      {charts.lowStockPreview && charts.lowStockPreview.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Immediate Reorder Recommended ({charts.lowStockPreview.length} Products)
              </h3>
            </div>
            <button
              onClick={() => navigate('/inventory/low-stock')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              View Full Alert Report →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {charts.lowStockPreview.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="truncate mr-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Min Required: {item.minStock} | Reorder: {item.reorderLevel}
                  </div>
                </div>
                <Badge variant="low_stock">{item.currentStock} left</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
