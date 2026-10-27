import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Download,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const DemandForecast = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await api.get('/forecast/demand');
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error('Failed to load AI demand forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const metrics = data?.metrics || {};
  const products = data?.products || [];
  const chartData = data?.timelineChart || [];

  const handleExport = () => {
    const formatted = products.map((p) => ({
      Product: p.product?.name,
      SKU: p.product?.sku,
      CurrentStock: p.currentStock,
      DailyVelocity: p.dailyVelocity,
      Forecast7Days: p.forecast7,
      Forecast30Days: p.forecast30,
      Forecast90Days: p.forecast90,
      Trend: p.trend,
      GrowthRate: `${p.growthRate}%`,
      DaysToStockout: p.daysUntilStockout,
      RecommendedPurchase: p.recommendedPurchase,
    }));
    exportToCSV(formatted, 'ai_demand_forecast.csv');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI-Powered Demand Forecasting"
        subtitle="Predictive sales velocity modelling, runout risk dates, and seasonal replenishment projection"
        breadcrumbs={[{ name: 'Analytics' }, { name: 'Demand Forecast' }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Predictions</span>
            </button>
            <button
              onClick={fetchForecast}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
              title="Rerun AI Inference"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* KPI Cards: 4 Key Forecast Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="30-Day Demand Projection"
          value={`${metrics.totalExpectedDemand30 || 0} units`}
          subtitle={`7d: ${metrics.totalExpectedDemand7 || 0} | 90d: ${metrics.totalExpectedDemand90 || 0} units`}
          icon={BrainCircuit}
          color="indigo"
        />
        <StatCard
          title="Forecasted Revenue (30d)"
          value={formatCurrency(metrics.totalForecastedRevenue30 || 0)}
          subtitle="Projected order conversion"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Imminent Stockout Risk"
          value={`${metrics.highRiskCount || 0} SKUs`}
          subtitle="Will deplete within 14 days"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Recommended Purchase"
          value={`${metrics.recommendedPurchaseUnits || 0} units`}
          subtitle="To prevent stock depletion"
          icon={ShoppingCart}
          color="purple"
        />
      </div>

      {/* Actual vs Forecasted Timeline Recharts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Historical Velocity vs Future Demand Forecast (Units)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Moving average model factoring historical monthly sales + sales momentum trend
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Invoiced Demand"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorActual)"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="AI Projected Demand"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="url(#colorForecast)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product-wise Forecast Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Product Demand Velocity & Reorder Recommendations
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{products.length} Analyzed SKUs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product Name & SKU</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Daily Velocity</th>
                <th className="px-4 py-3">7-Day Demand</th>
                <th className="px-4 py-3">30-Day Demand</th>
                <th className="px-4 py-3">Trend Direction</th>
                <th className="px-4 py-3">Days Until Stockout</th>
                <th className="px-4 py-3 text-right">Reorder Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {products.map((p) => {
                const isUrgent = p.daysUntilStockout < 14;
                return (
                  <tr key={p.product?._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{p.product?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SKU: {p.product?.sku}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {p.currentStock} units
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {p.dailyVelocity} / day
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                      ~{p.forecast7} units
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      ~{p.forecast30} units
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.trend === 'Surging' || p.trend === 'Growing'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.trend === 'Declining'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {p.trend === 'Surging' || p.trend === 'Growing' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : p.trend === 'Declining' ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : null}
                        <span>
                          {p.trend} ({p.growthRate > 0 ? '+' : ''}{p.growthRate}%)
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        ~{p.daysUntilStockout} days
                      </span>
                      {isUrgent && (
                        <span className="block text-[10px] text-rose-500 font-medium">Critical Depletion</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {p.recommendedPurchase > 0 ? `${p.recommendedPurchase} units` : 'Optimal'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DemandForecast;
