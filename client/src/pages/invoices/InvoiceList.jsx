import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Mail, Eye, Printer, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);

  // Email modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const navigate = useNavigate();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (paymentStatus) params.append('paymentStatus', paymentStatus);
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/invoices?${params.toString()}`);
      if (res.success) {
        setInvoices(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, paymentStatus, page]);

  const handleOpenEmail = (inv) => {
    setSelectedInvoice(inv);
    setRecipientEmail(inv.customer?.email || '');
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!recipientEmail) return;

    try {
      setSendingEmail(true);
      const res = await api.post(`/invoices/${selectedInvoice._id}/send-email`, {
        email: recipientEmail,
      });
      if (res.success) {
        toast.success(res.message);
        setEmailModalOpen(false);
      }
    } catch (err) {
      toast.error(err.message || 'Error sending invoice email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleExport = () => {
    const formatted = invoices.map((inv) => ({
      InvoiceNumber: inv.invoiceNumber,
      Customer: inv.customer?.name,
      Date: formatDate(inv.createdAt),
      GrandTotal: inv.grandTotal,
      PaidAmount: inv.paidAmount,
      DueAmount: inv.dueAmount,
      PaymentMethod: inv.paymentMethod,
      PaymentStatus: inv.paymentStatus,
    }));
    exportToCSV(formatted, 'invoices_register.csv');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Invoice Registry"
        subtitle="Manage client invoices, generate official PDF receipts, email statements, and track receivables"
        breadcrumbs={[{ name: 'Invoices' }]}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Registry</span>
          </button>
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
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Billed Customer</th>
                <th className="px-4 py-3">Issued Date</th>
                <th className="px-4 py-3">Grand Total</th>
                <th className="px-4 py-3">Paid / Due</th>
                <th className="px-4 py-3">Settlement</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading billing registry...</span>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inv.customer?.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{inv.customer?.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-emerald-600 font-bold">{formatCurrency(inv.paidAmount || 0)}</div>
                      {inv.dueAmount > 0 && (
                        <div className="text-[10px] text-rose-500 font-bold">
                          Due: {formatCurrency(inv.dueAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 uppercase font-medium text-[11px]">
                      {inv.paymentMethod}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={inv.paymentStatus}>{inv.paymentStatus}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => generateInvoicePDF(inv)}
                        title="Download PDF"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEmail(inv)}
                        title="Email Invoice"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/sales/invoices/${inv._id}`)}
                        title="View Invoice"
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

      {/* Email Invoice Modal */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title={`Email Invoice: ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recipient Email Address *
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="customer@domain.com"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setEmailModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendingEmail}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg flex items-center space-x-1"
            >
              {sendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              <span>Send Invoice Email</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceList;
