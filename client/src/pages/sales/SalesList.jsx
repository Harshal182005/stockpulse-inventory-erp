import React, { useState, useEffect } from 'react';
import { Search, Receipt, Eye, Download, Calendar, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (paymentStatus) params.append('paymentStatus', paymentStatus);
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/sales?${params.toString()}`);
      if (res.success) {
        setSales(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, paymentStatus, page]);

  const handleExport = () => {
    const formatted = sales.map((s) => ({
      InvoiceNumber: s.invoiceNumber,
      Customer: s.customerName,
      ItemsCount: s.items?.length,
      Subtotal: s.subtotal,
      Discount: s.discountTotal,
      Tax: s.taxTotal,
      GrandTotal: s.grandTotal,
      PaymentMethod: s.paymentMethod,
      PaymentStatus: s.paymentStatus,
      Date: formatDate(s.createdAt, true),
    }));
    exportToCSV(formatted, 'sales_orders_ledger.csv');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Orders & Register"
        subtitle="Complete record of all POS checkout transactions, customer invoices, and payment receipts"
        breadcrumbs={[{ name: 'Sales', path: '/sales/orders' }, { name: 'Orders' }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => navigate('/sales/pos')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Receipt className="w-4 h-4" />
              <span>Open POS</span>
            </button>
          </div>
        }
      />

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
            placeholder="Search invoice # or customer..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items Sold</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading sales transactions...</span>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No sales records found
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {s.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {s.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400">{s.customerPhone || 'Walk-in'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt, true)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {s.items?.length || 0} items
                      </span>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {s.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(s.grandTotal)}
                    </td>
                    <td className="px-4 py-3 uppercase font-medium text-[11px]">
                      {s.paymentMethod}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.paymentStatus}>{s.paymentStatus}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/sales/orders/${s._id}`)}
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

export default SalesList;
