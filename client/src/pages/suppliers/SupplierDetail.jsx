import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Phone, Mail, Building, FileText, CreditCard, Plus, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const SupplierDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/suppliers/${id}`);
      if (res.success) setData(res.data);
    } catch (err) {
      toast.error('Failed to load supplier profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-xs text-slate-400">Loading supplier telemetry...</p>
      </div>
    );
  }

  if (!data?.supplier) {
    return <div className="p-8 text-center text-sm">Supplier not found</div>;
  }

  const { supplier, purchases, payments, summary } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={supplier.companyName}
        subtitle={`Contact: ${supplier.name} | Phone: ${supplier.phone}`}
        breadcrumbs={[{ name: 'Suppliers', path: '/purchases/suppliers' }, { name: supplier.companyName }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/purchases/suppliers')}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => navigate('/purchases/orders')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>
          </div>
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Purchased</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(summary.totalPurchased || 0)}
          </div>
          <span className="text-xs text-slate-400">{summary.totalPurchasesCount || 0} purchase orders</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Settled</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(summary.totalPaid || 0)}
          </div>
          <span className="text-xs text-slate-400">Disbursed payments</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(summary.outstandingBalance || 0)}
          </div>
          <span className="text-xs text-slate-400">Accounts payable</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Terms</span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {supplier.paymentTerms || 'Net 30'}
          </div>
          <span className="text-xs text-slate-400">GST: {supplier.gstNumber || '-'}</span>
        </div>
      </div>

      {/* Tabs / Tables: Purchases and Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Purchase Orders History</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">PO #</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-slate-400">No POs recorded yet</td>
                  </tr>
                ) : (
                  purchases.map((po) => (
                    <tr key={po._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-2.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {po.purchaseNumber}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{formatDate(po.createdAt)}</td>
                      <td className="px-3 py-2.5 font-bold">{formatCurrency(po.grandTotal)}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={po.orderStatus}>{po.orderStatus}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Disbursed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Settled Payment Receipts</span>
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
                    <td colSpan="4" className="text-center py-6 text-slate-400">No payments recorded</td>
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

export default SupplierDetail;
