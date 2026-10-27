import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Mail, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import toast from 'react-hot-toast';

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        const [invRes, setRes] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get('/settings'),
        ]);
        if (invRes.success) setInvoice(invRes.data);
        if (setRes.success) setSettings(setRes.data);
      } catch (err) {
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-xs text-slate-400">Loading invoice document...</p>
      </div>
    );
  }

  if (!invoice) {
    return <div className="p-8 text-center text-sm">Invoice not found</div>;
  }

  const business = settings?.business || {
    name: 'StockPulse Inventory Systems Ltd.',
    legalName: 'StockPulse Technologies Private Limited',
    address: 'Plot 42, Tech Park Avenue, Silicon Valley',
    phone: '+91 98765 43210',
    email: 'contact@stockpulse.local',
    gstNumber: '29ABCDE1234F1Z5',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Invoice: ${invoice.invoiceNumber}`}
        subtitle={`Issued on ${formatDate(invoice.createdAt)}`}
        breadcrumbs={[{ name: 'Invoices', path: '/sales/invoices' }, { name: invoice.invoiceNumber }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/sales/invoices')}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={() => generateInvoicePDF(invoice, settings)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        }
      />

      {/* Printable Invoice Container */}
      <div
        id="printable-invoice"
        className="bg-white text-slate-900 rounded-2xl p-8 border border-slate-200 shadow-md space-y-8"
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="text-2xl font-black text-indigo-600 tracking-tight">
              {business.name}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">{business.address}</p>
            <p className="text-xs text-slate-500">
              Phone: {business.phone} | Email: {business.email}
            </p>
            <p className="text-xs font-mono font-bold text-slate-700 mt-1">
              GSTIN / Tax ID: {business.gstNumber}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-3xl font-black tracking-tight text-slate-900 uppercase">
              INVOICE
            </span>
            <div className="text-sm font-mono font-bold text-indigo-600 mt-1">
              {invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Date: <span className="font-semibold text-slate-800">{formatDate(invoice.createdAt)}</span>
            </div>
            <div className="mt-1">
              <Badge variant={invoice.paymentStatus}>{invoice.paymentStatus}</Badge>
            </div>
          </div>
        </div>

        {/* Bill To & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Billed To:
            </span>
            <div className="font-bold text-sm text-slate-900">
              {invoice.customer?.name || 'Walk-in Customer'}
            </div>
            {invoice.customer?.phone && (
              <div className="text-slate-600 mt-0.5">Phone: {invoice.customer.phone}</div>
            )}
            {invoice.customer?.email && (
              <div className="text-slate-600">Email: {invoice.customer.email}</div>
            )}
            {invoice.customer?.address && (
              <div className="text-slate-600">{invoice.customer.address}</div>
            )}
            {invoice.customer?.gstNumber && (
              <div className="font-mono text-slate-700 mt-0.5">GSTIN: {invoice.customer.gstNumber}</div>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Payment Terms & Settlement
            </span>
            <div>
              Payment Method: <span className="font-bold uppercase">{invoice.paymentMethod}</span>
            </div>
            <div>
              Payment Due Date: <span className="font-bold">{formatDate(invoice.dueDate)}</span>
            </div>
            <div>
              Paid Amount: <span className="font-bold text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            {invoice.dueAmount > 0 && (
              <div>
                Balance Payable: <span className="font-bold text-rose-600">{formatCurrency(invoice.dueAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-300">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Item Description</th>
                <th className="px-3 py-2.5">SKU</th>
                <th className="px-3 py-2.5 text-center">Qty</th>
                <th className="px-3 py-2.5 text-right">Unit Price</th>
                <th className="px-3 py-2.5 text-center">Tax %</th>
                <th className="px-3 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2.5 text-slate-400">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-900">{item.name}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-500">{item.sku || '-'}</td>
                  <td className="px-3 py-2.5 text-center font-bold">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-2.5 text-center">{item.taxRate || 0}%</td>
                  <td className="px-3 py-2.5 font-bold text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax / GST:</span>
              <span>+{formatCurrency(invoice.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
              <span>Grand Total:</span>
              <span className="text-indigo-600 text-lg">{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer Terms */}
        <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
          <div className="font-bold text-slate-700">Terms & Conditions:</div>
          <div>1. Goods once sold will not be returned unless defective on delivery.</div>
          <div>2. Invoice payments are subject to standard commercial credit terms.</div>
          <p className="pt-2 text-center text-slate-400 font-medium italic">
            {settings?.invoice?.footerText || 'Thank you for choosing StockPulse!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
