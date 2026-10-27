import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import { formatDate, getDaysDifference } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const ExpiryList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchExpiring = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/expiring?days=60');
      if (res.success) setProducts(res.data);
    } catch (err) {
      toast.error('Failed to load expiry inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiring();
  }, []);

  const handleExport = () => {
    const formatted = products.map((p) => {
      const daysLeft = getDaysDifference(p.expiryDate);
      return {
        SKU: p.sku,
        Name: p.name,
        BatchNumber: p.batchNumber,
        CurrentStock: p.currentStock,
        Unit: p.unit,
        ExpiryDate: formatDate(p.expiryDate),
        DaysLeft: daysLeft,
        Warehouse: p.warehouse?.name,
      };
    });
    exportToCSV(formatted, 'expiry_tracking_report.csv');
  };

  const filtered = products.filter((p) => {
    const days = getDaysDifference(p.expiryDate);
    if (filter === 'expired') return days < 0;
    if (filter === '7days') return days >= 0 && days <= 7;
    if (filter === '30days') return days >= 0 && days <= 30;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expiry Date & Batch Management"
        subtitle="Proactively track product expiration dates, batch numbers, and dead stock prevention"
        breadcrumbs={[{ name: 'Inventory', path: '/inventory/stock' }, { name: 'Expiry Tracking' }]}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Expiry Report</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          All Items ({products.length})
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === 'expired'
              ? 'bg-rose-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Expired
        </button>
        <button
          onClick={() => setFilter('7days')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === '7days'
              ? 'bg-orange-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Expiring in ≤ 7 Days
        </button>
        <button
          onClick={() => setFilter('30days')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === '30days'
              ? 'bg-amber-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Expiring in ≤ 30 Days
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Batch Number</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Time Left</th>
                <th className="px-4 py-3">Warehouse Location</th>
                <th className="px-4 py-3">Recommended Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Analyzing product shelf life...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>No products matching this expiry status</span>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const daysLeft = getDaysDifference(p.expiryDate);
                  let variant = 'safe';
                  let statusText = `${daysLeft} days left`;

                  if (daysLeft < 0) {
                    variant = 'expired';
                    statusText = `EXPIRED (${Math.abs(daysLeft)}d ago)`;
                  } else if (daysLeft === 0) {
                    variant = 'expiring_today';
                    statusText = 'EXPIRING TODAY';
                  } else if (daysLeft <= 7) {
                    variant = 'expiring_7_days';
                    statusText = `${daysLeft} days remaining`;
                  } else if (daysLeft <= 30) {
                    variant = 'expiring_30_days';
                    statusText = `${daysLeft} days remaining`;
                  }

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.batchNumber || '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {p.currentStock} {p.unit}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(p.expiryDate)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={variant}>{statusText}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{p.warehouse?.name || 'Central Hub'}</div>
                        <div className="text-[10px] text-slate-400">
                          Rack {p.rack || '-'} / Shelf {p.shelf || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {daysLeft < 0 ? (
                          <span className="text-rose-600 font-bold">Write-off / Dispose Batch</span>
                        ) : daysLeft <= 14 ? (
                          <span className="text-orange-600 font-semibold">Apply 20% clearance discount</span>
                        ) : (
                          <span>Prioritize FIFO distribution</span>
                        )}
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

export default ExpiryList;
