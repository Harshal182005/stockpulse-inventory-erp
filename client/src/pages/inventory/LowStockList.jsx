import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShoppingCart, RefreshCw, Truck, ArrowRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const LowStockList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/low-stock');
      if (res.success) setProducts(res.data);
    } catch (err) {
      toast.error('Failed to load low stock products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleExport = () => {
    const formatted = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      CurrentStock: p.currentStock,
      MinStock: p.minStock,
      ReorderLevel: p.reorderLevel,
      RecommendedOrder: Math.max(0, p.maxStock - p.currentStock),
      Supplier: p.supplier?.companyName || '-',
      LeadTimeDays: p.leadTimeDays || 5,
    }));
    exportToCSV(formatted, 'low_stock_urgent_report.csv');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Low Stock & Stockout Alerts"
        subtitle="Catalog items currently at or below minimum replenishment thresholds"
        breadcrumbs={[{ name: 'Inventory', path: '/inventory/stock' }, { name: 'Low Stock' }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Low Stock Report</span>
            </button>
            <button
              onClick={() => navigate('/purchases/orders')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Issue Purchase Orders</span>
            </button>
          </div>
        }
      />

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {products.length} Products Require Immediate Replenishment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Items listed below risk stock-out within their standard supplier lead times.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product Name & SKU</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Safety Thresholds</th>
                <th className="px-4 py-3">Recommended Order Qty</th>
                <th className="px-4 py-3">Supplier & Lead Time</th>
                <th className="px-4 py-3 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Checking inventory thresholds...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-emerald-600 font-semibold">
                    ✅ All inventory levels are above safety minimums! No stockout alerts.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const recommended = Math.max(0, p.maxStock - p.currentStock);
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.currentStock === 0 ? 'out_of_stock' : 'low_stock'}>
                          {p.currentStock === 0 ? 'OUT OF STOCK' : `${p.currentStock} ${p.unit} left`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 dark:text-slate-200">
                          Min Safety: <span className="font-bold">{p.minStock}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Reorder Trigger: {p.reorderLevel} | Max: {p.maxStock}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                          {recommended} {p.unit}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Est. Cost: {formatCurrency(recommended * p.purchasePrice)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.supplier?.companyName || 'Standard Vendor'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Lead time: {p.leadTimeDays || 5} business days
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate('/purchases/orders')}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                        >
                          <span>Order</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LowStockList;
