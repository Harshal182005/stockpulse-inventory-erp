import React, { useState, useEffect } from 'react';
import { Plus, Search, CreditCard, ArrowDownRight, ArrowUpRight, DollarSign, Download, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [page, setPage] = useState(1);

  // Customers & Suppliers for modal
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'customer_receipt',
    partyId: '',
    amount: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
  });

  const { hasRole } = useAuth();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);
      if (paymentMethod) params.append('paymentMethod', paymentMethod);
      params.append('page', page);
      params.append('limit', 15);

      const [payRes, statRes] = await Promise.all([
        api.get(`/payments?${params.toString()}`),
        api.get('/payments/stats'),
      ]);

      if (payRes.success) {
        setPayments(payRes.data);
        setPagination(payRes.pagination);
      }
      if (statRes.success) setStats(statRes.data);
    } catch (err) {
      toast.error('Failed to load payment transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const [custRes, suppRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/suppliers?limit=100'),
      ]);
      if (custRes.success) setCustomers(custRes.data);
      if (suppRes.success) setSuppliers(suppRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, type, paymentMethod, page]);

  useEffect(() => {
    fetchParties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isReceipt = formData.type === 'customer_receipt';
      const selectedParty = isReceipt
        ? customers.find((c) => c._id === formData.partyId)
        : suppliers.find((s) => s._id === formData.partyId);

      const payload = {
        type: formData.type,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber,
        notes: formData.notes,
        customerId: isReceipt ? formData.partyId : undefined,
        supplierId: !isReceipt ? formData.partyId : undefined,
        partyName: isReceipt ? selectedParty?.name : selectedParty?.companyName,
      };

      const res = await api.post('/payments', payload);
      if (res.success) {
        toast.success('Payment recorded successfully');
        setModalOpen(false);
        setFormData({
          type: 'customer_receipt',
          partyId: '',
          amount: '',
          paymentMethod: 'cash',
          referenceNumber: '',
          notes: '',
        });
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.message || 'Error recording payment');
    }
  };

  const handleExport = () => {
    const formatted = payments.map((p) => ({
      PaymentNumber: p.paymentNumber,
      Type: p.type === 'customer_receipt' ? 'Customer Receipt' : 'Supplier Payment',
      Party: p.partyName || p.customer?.name || p.supplier?.companyName,
      Amount: p.amount,
      PaymentMethod: p.paymentMethod,
      Reference: p.referenceNumber,
      Date: formatDate(p.paymentDate, true),
    }));
    exportToCSV(formatted, 'payments_cashflow_ledger.csv');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Cash Flow Ledger"
        subtitle="Track incoming client receivables, vendor settlement payouts, and reconciliation balances"
        breadcrumbs={[{ name: 'Payments' }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger</span>
            </button>
            {hasRole('admin', 'accountant', 'manager') && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            )}
          </div>
        }
      />

      {/* Cashflow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Inflow Receipts</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(stats?.totalReceipts || 0)}
            </div>
            <span className="text-xs text-slate-400">Customer collections</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Outflow Payouts</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(stats?.totalPayouts || 0)}
            </div>
            <span className="text-xs text-slate-400">Vendor disbursements</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Operational Cashflow</span>
            <div className={`text-2xl font-black mt-1 ${stats?.netCashflow >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
              {formatCurrency(stats?.netCashflow || 0)}
            </div>
            <span className="text-xs text-slate-400">Net treasury delta</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search receipt #, party, UTR..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Flow Types</option>
            <option value="customer_receipt">Customer Receipts (+ In)</option>
            <option value="supplier_payment">Supplier Payouts (- Out)</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Receipt / Voucher #</th>
                <th className="px-4 py-3">Flow Type</th>
                <th className="px-4 py-3">Party Name</th>
                <th className="px-4 py-3">Settlement Date</th>
                <th className="px-4 py-3">Settlement Method</th>
                <th className="px-4 py-3">Txn Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading cash flow records...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No payment transactions found
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isReceipt = p.type === 'customer_receipt';
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-bold font-mono text-slate-900 dark:text-white">
                        {p.paymentNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isReceipt
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isReceipt ? 'Customer Receipt' : 'Supplier Payout'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {p.partyName || p.customer?.name || p.supplier?.companyName || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(p.paymentDate, true)}</td>
                      <td className="px-4 py-3 uppercase font-medium text-[11px]">
                        {p.paymentMethod}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {p.referenceNumber || '-'}
                      </td>
                      <td
                        className={`px-4 py-3 font-black text-right text-sm ${
                          isReceipt
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isReceipt ? '+' : '-'}
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Payment / Receipt Voucher"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Flow Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'customer_receipt', partyId: '' })}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  formData.type === 'customer_receipt'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Customer Receipt (+ In)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'supplier_payment', partyId: '' })}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  formData.type === 'supplier_payment'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Supplier Payout (- Out)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {formData.type === 'customer_receipt' ? 'Select Customer *' : 'Select Vendor Supplier *'}
            </label>
            <select
              required
              value={formData.partyId}
              onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">Select Party</option>
              {formData.type === 'customer_receipt'
                ? customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} (Balance Due: {formatCurrency(c.currentBalance || 0)})
                    </option>
                  ))
                : suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.companyName} (Payable: {formatCurrency(s.currentBalance || 0)})
                    </option>
                  ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Settled Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Debit / Credit Card</option>
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Reference / Cheque / UTR #
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="e.g. UTR-9988771122"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Part payment for monthly statement"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg"
            >
              Authorize & Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentList;
