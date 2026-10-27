import React, { useState, useEffect } from 'react';
import { History, Search, ArrowLeftRight, Download, Filter } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const StockMovementList = () => {
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      params.append('page', page);
      params.append('limit', 20);

      const res = await api.get(`/inventory/movements?${params.toString()}`);
      if (res.success) {
        setMovements(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [type, page]);

  const handleExport = () => {
    const formatted = movements.map((m) => ({
      Date: formatDate(m.createdAt, true),
      Product: m.product?.name,
      SKU: m.product?.sku,
      Type: m.type,
      Quantity: m.quantity,
      PreviousStock: m.previousStock,
      NewStock: m.newStock,
      Warehouse: m.warehouse?.name,
      Destination: m.destinationWarehouse?.name || '-',
      Reason: m.reason,
      User: m.user?.name || 'System',
    }));
    exportToCSV(formatted, 'stock_movement_audit.csv');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movement Audit Trail"
        subtitle="Complete immutable log of all inventory inflows, sales deductions, physical adjustments, and transfers"
        breadcrumbs={[{ name: 'Inventory', path: '/inventory/stock' }, { name: 'Stock Movements' }]}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-500">Filter Type:</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          >
            <option value="">All Movement Types</option>
            <option value="IN">IN (Stock In)</option>
            <option value="OUT">OUT (Stock Out)</option>
            <option value="PURCHASE">PURCHASE (PO Ingestion)</option>
            <option value="SALE">SALE (POS Outflow)</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
            <option value="TRANSFER">TRANSFER (Inter-hub)</option>
            <option value="PURCHASE_RETURN">PURCHASE RETURN</option>
            <option value="SALES_RETURN">SALES RETURN</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Movement Type</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Stock Before → After</th>
                <th className="px-4 py-3">Warehouse Routing</th>
                <th className="px-4 py-3">Reason / Details</th>
                <th className="px-4 py-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {movements.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                    {formatDate(m.createdAt, true)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white">{m.product?.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">SKU: {m.product?.sku}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ['IN', 'PURCHASE', 'SALES_RETURN'].includes(m.type)
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ['OUT', 'SALE', 'PURCHASE_RETURN'].includes(m.type)
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {m.quantity} {m.product?.unit}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="text-slate-400">{m.previousStock}</span> →{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{m.newStock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {m.warehouse?.name || 'Central Hub'}
                    </div>
                    {m.destinationWarehouse && (
                      <div className="text-[10px] text-indigo-500 font-medium flex items-center space-x-1">
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Dest: {m.destinationWarehouse.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {m.reason || m.referenceId || '-'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {m.user?.name || 'System Auto'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>
    </div>
  );
};

export default StockMovementList;
