import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Phone, Mail, FileText, CreditCard, ShoppingCart, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const CustomerDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}`);
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error('Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-xs text-slate-400">Loading customer telemetry...</p>
      </div>
    );
  }

  if (!data?.customer) {
    return <div className="p-8 text-center text-sm">Customer not found</div>;
  }

  const { customer, sales, payments, summary } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={customer.name}
        subtitle={`Phone: ${customer.phone} | Email: ${customer.email || 'None'}`}
        breadcrumbs={[{ name: 'Customers', path: '/sales/customers' }, { name: customer.name }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/sales/customers')}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => navigate('/sales/pos')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>New POS Sale</span>
            </button>
          </div>
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Billed</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(summary.totalPurchased || 0)}
          </div>
          <span className="text-xs text-slate-400">{summary.totalOrdersCount || 0} order invoices</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(summary.totalPaid || 0)}
          </div>
          <span className="text-xs text-slate-400">Received receipts</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Receivable</span>
          <div className={`text-xl font-bold mt-1 ${summary.outstandingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
            {formatCurrency(summary.outstandingBalance || 0)}
          </div>
          <span className="text-xs text-slate-400">Pending customer debt</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Credit Limit</span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(customer.creditLimit || 0)}
          </div>
          <span className="text-xs text-slate-400">GST: {customer.gstNumber || '-'}</span>
        </div>
      </div>

      {/* Tabs / Tables: Sales Orders and Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Sales Orders & Invoices</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Invoice #</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-slate-400">No invoices recorded</td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-2.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {s.invoiceNumber}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{formatDate(s.createdAt)}</td>
                      <td className="px-3 py-2.5 font-bold">{formatCurrency(s.grandTotal)}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={s.paymentStatus}>{s.paymentStatus}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Receipts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Received Payment Receipts</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Receipt #</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-slate-400">No payment receipts recorded</td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-2.5 font-mono font-semibold">{pay.paymentNumber}</td>
                      <td className="px-3 py-2.5 text-slate-500">{formatDate(pay.paymentDate)}</td>
                      <td className="px-3 py-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="px-3 py-2.5 uppercase font-medium text-[11px]">
                        {pay.paymentMethod}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
