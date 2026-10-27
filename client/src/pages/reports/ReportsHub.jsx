import React, { useState, useEffect } from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const ReportsHub = () => {
  const [activeTab, setActiveTab] = useState('profit-loss');
  const [period, setPeriod] = useState('thisMonth');
  const [loading, setLoading] = useState(true);

  // Data states
  const [plData, setPlData] = useState(null);
  const [salesData, setSalesData] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      if (activeTab === 'profit-loss') {
        const res = await api.get(`/reports/profit-loss?period=${period}`);
        if (res.success) setPlData(res.data);
      } else if (activeTab === 'sales') {
        const res = await api.get(`/reports/sales?period=${period}`);
        if (res.success) setSalesData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load financial statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, period]);

  const handleExportPL = () => {
    if (!plData) return;
    const summary = plData.summary;
    const rows = [
      { Metric: 'Gross Revenue', Amount: summary.totalRevenue },
      { Metric: 'Cost of Goods Sold (COGS)', Amount: summary.cogs },
      { Metric: 'Gross Profit', Amount: summary.grossProfit },
      { Metric: 'Gross Margin', Amount: summary.grossMargin },
      { Metric: 'Operating Overhead Expenses', Amount: summary.totalExpenses },
      { Metric: 'Net Profit', Amount: summary.netProfit },
      { Metric: 'Net Margin', Amount: summary.netMargin },
    ];
    exportToCSV(rows, `profit_and_loss_${period}.csv`);
  };

  const handleExportSales = () => {
    if (!salesData) return;
    const formatted = salesData.productBreakdown?.map((p) => ({
      SKU: p.sku,
      Product: p.name,
      UnitsSold: p.quantity,
      RevenueGenerated: p.revenue,
      GrossProfit: p.profit,
    }));
    exportToCSV(formatted, `sales_performance_${period}.csv`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fiscal Reports & Analytics Hub"
        subtitle="Audited financial summaries, Net Profit calculations, COGS reconciliation, and sales performance"
        breadcrumbs={[{ name: 'Finance' }, { name: 'Reports' }]}
        actions={
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
              <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 pr-3 py-1 focus:outline-none"
              >
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
              </select>
            </div>

            <button
              onClick={activeTab === 'profit-loss' ? handleExportPL : handleExportSales}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* Tabs Selector */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('profit-loss')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profit-loss'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Profit & Loss Statement</span>
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sales'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Product Sales Report</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-xs text-slate-400">Compiling financial ledgers...</p>
        </div>
      ) : activeTab === 'profit-loss' ? (
        /* Profit & Loss Statement Tab */
        <div className="space-y-6">
          {/* Formula Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between shadow-md border border-slate-800 gap-3">
            <div className="text-xs">
              <span className="font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                Net Profit Formula:
              </span>
              <span className="font-mono text-sm">
                Revenue ({formatCurrency(plData?.summary?.totalRevenue || 0)}) - COGS ({formatCurrency(plData?.summary?.cogs || 0)}) - Expenses ({formatCurrency(plData?.summary?.totalExpenses || 0)}) ={' '}
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(plData?.summary?.netProfit || 0)}
                </span>
              </span>
            </div>
            <div className="text-right flex items-center space-x-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Gross Margin</span>
                <div className="text-sm font-bold text-indigo-300">{plData?.summary?.grossMargin}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Net Margin</span>
                <div className="text-sm font-bold text-emerald-400">{plData?.summary?.netMargin}</div>
              </div>
            </div>
          </div>

          {/* Detailed Financial Breakdown Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Audited Income Statement
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Total Billed Gross Revenue:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(plData?.summary?.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400">
                  <span>Less: Cost of Goods Sold (COGS):</span>
                  <span className="font-bold">-{formatCurrency(plData?.summary?.cogs)}</span>
                </div>
                <div className="flex justify-between py-2.5 bg-slate-50 dark:bg-slate-800/50 px-3 rounded-xl font-bold">
                  <span className="text-slate-900 dark:text-white">Gross Operating Profit:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(plData?.summary?.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400">
                  <span>Less: Overhead Operating Expenses:</span>
                  <span className="font-bold">-{formatCurrency(plData?.summary?.totalExpenses)}</span>
                </div>
                <div className="flex justify-between py-3 bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-xl font-black text-sm">
                  <span className="text-emerald-900 dark:text-emerald-200">Net Operational Profit:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base">
                    {formatCurrency(plData?.summary?.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Overhead Expenses Category Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Operating Expenses Distribution
              </h3>
              <div className="space-y-2">
                {plData?.expenseBreakdown?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No expenses incurred in this period.</p>
                ) : (
                  plData?.expenseBreakdown?.map((e, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200">{e.category}</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Product Sales Report Tab */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Product-wise Performance Breakdown
            </h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Total Period Revenue: {formatCurrency(salesData?.totalRevenue || 0)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Product Name & SKU</th>
                  <th className="px-4 py-3">Total Units Sold</th>
                  <th className="px-4 py-3">Revenue Invoiced</th>
                  <th className="px-4 py-3 text-right">Gross Profit Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {salesData?.productBreakdown?.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {p.quantity} units
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.revenue)}
                    </td>
                    <td className="px-4 py-3 font-bold text-right text-emerald-600 dark:text-emerald-400 text-sm">
                      +{formatCurrency(p.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsHub;
