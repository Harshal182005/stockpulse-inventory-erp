import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, User, CreditCard, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import toast from 'react-hot-toast';

const SaleDetail = () => {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sales/${id}`);
        if (res.success) setSale(res.data);
      } catch (err) {
        toast.error('Failed to load sale record');
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-xs text-slate-400">Loading order telemetry...</p>
      </div>
    );
  }

  if (!sale) {
    return <div className="p-8 text-center text-sm">Sale record not found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Sales Order: ${sale.invoiceNumber}`}
        subtitle={`Billed to ${sale.customerName} on ${formatDate(sale.createdAt, true)}`}
        breadcrumbs={[{ name: 'Sales', path: '/sales/orders' }, { name: sale.invoiceNumber }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/sales/orders')}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => generateInvoicePDF(sale)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF Invoice</span>
            </button>
          </div>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Customer</span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
              {sale.customerName}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Contact</span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
              {sale.customerPhone || 'Walk-in'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Payment Method</span>
            <div className="text-xs font-bold uppercase text-slate-900 dark:text-white mt-0.5">
              {sale.paymentMethod}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Settlement Status</span>
            <div className="mt-0.5">
              <Badge variant={sale.paymentStatus}>{sale.paymentStatus}</Badge>
            </div>
          </div>
        </div>

        {/* Item Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Unit Price</th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Tax %</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sale.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">
                    {item.productName}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-400">{item.sku}</td>
                  <td className="px-3 py-2.5 font-bold">{item.quantity}</td>
                  <td className="px-3 py-2.5">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-2.5">{item.discount || 0}%</td>
                  <td className="px-3 py-2.5">{item.taxRate || 0}%</td>
                  <td className="px-3 py-2.5 font-bold text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discountTotal > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Discount Total:</span>
                <span>-{formatCurrency(sale.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax / GST:</span>
              <span>+{formatCurrency(sale.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Grand Total:</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-lg">
                {formatCurrency(sale.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;
