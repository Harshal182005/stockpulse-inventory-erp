import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, Eye, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/purchases?${params.toString()}`);
      if (res.success) {
        setPurchases(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [search, status, page]);

  const handleReceive = async (purchaseId, poNumber) => {
    try {
      const res = await api.put(`/purchases/${purchaseId}/receive`);
      if (res.success) {
        toast.success(`Purchase ${poNumber} received and inventory updated!`);
        fetchPurchases();
      }
    } catch (err) {
      toast.error(err.message || 'Error marking purchase as received');
    }
  };

  const handleExport = () => {
    const formatted = purchases.map((p) => ({
      PONumber: p.purchaseNumber,
      Supplier: p.supplier?.companyName,
      ItemsCount: p.items?.length,
      GrandTotal: p.grandTotal,
      PaymentStatus: p.paymentStatus,
      OrderStatus: p.orderStatus,
      Date: formatDate(p.createdAt),
    }));
    exportToCSV(formatted, 'purchase_orders_report.csv');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders (Procurement)"
        subtitle="Manage inbound vendor replenishment, receive stock into warehouses, and track payable status"
        breadcrumbs={[{ name: 'Purchases', path: '/purchases/orders' }, { name: 'Orders' }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            {hasRole('admin', 'manager') && (
              <button
                onClick={() => navigate('/purchases/new')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Purchase Order</span>
              </button>
            )}
          </div>
        }
      />

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by PO number..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Order Statuses</option>
            <option value="ordered">Ordered (In Transit)</option>
            <option value="received">Received (In Stock)</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Order Date</th>
                <th className="px-4 py-3">Items Summary</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3">Delivery Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading purchase orders...</span>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                purchases.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {po.purchaseNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {po.supplier?.companyName || '-'}
                      </div>
                      <div className="text-[10px] text-slate-400">{po.supplier?.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(po.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {po.items?.length || 0} product(s)
                      </span>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {po.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(po.grandTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={po.paymentStatus}>{po.paymentStatus}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={po.orderStatus}>{po.orderStatus}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {po.orderStatus === 'ordered' && hasRole('admin', 'manager') && (
                        <button
                          onClick={() => handleReceive(po._id, po.purchaseNumber)}
                          title="Mark Received & Increase Stock"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Receive</span>
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/purchases/${po._id}`)}
                        title="View PO Details"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>
    </div>
  );
};

export default PurchaseList;
