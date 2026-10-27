import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Printer, ShoppingCart, Truck, Warehouse, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PurchaseDetail = () => {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/purchases/${id}`);
      if (res.success) setPurchase(res.data);
    } catch (err) {
      toast.error('Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchase();
  }, [id]);

  const handleReceive = async () => {
    try {
      const res = await api.put(`/purchases/${id}/receive`);
      if (res.success) {
        toast.success('All items received and inventory successfully increased!');
        fetchPurchase();
      }
    } catch (err) {
      toast.error(err.message || 'Error marking received');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-xs text-slate-400">Loading purchase order...</p>
      </div>
    );
  }

  if (!purchase) {
    return <div className="p-8 text-center text-sm">Purchase order not found</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Purchase Order: ${purchase.purchaseNumber}`}
        subtitle={`Issued to ${purchase.supplier?.companyName} on ${formatDate(purchase.createdAt)}`}
        breadcrumbs={[{ name: 'Purchases', path: '/purchases/orders' }, { name: purchase.purchaseNumber }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/purchases/orders')}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print PO</span>
            </button>
            {purchase.orderStatus === 'ordered' && hasRole('admin', 'manager') && (
              <button
                onClick={handleReceive}
                className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Received & Stock Up</span>
              </button>
            )}
          </div>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Meta Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Vendor</span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
              {purchase.supplier?.companyName}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Delivery Hub</span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
              {purchase.warehouse?.name || 'Central Alpha'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Delivery Status</span>
            <div className="mt-0.5">
              <Badge variant={purchase.orderStatus}>{purchase.orderStatus}</Badge>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Payment Status</span>
            <div className="mt-0.5">
              <Badge variant={purchase.paymentStatus}>{purchase.paymentStatus}</Badge>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-3 py-2">Item Description</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Unit Cost</th>
                <th className="px-3 py-2">Tax %</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchase.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">
                    {item.productName}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-400">{item.sku}</td>
                  <td className="px-3 py-2.5 font-bold">{item.quantity}</td>
                  <td className="px-3 py-2.5">{formatCurrency(item.unitCost)}</td>
                  <td className="px-3 py-2.5">{item.taxRate}%</td>
                  <td className="px-3 py-2.5 font-bold text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Base Subtotal:</span>
              <span>{formatCurrency(purchase.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax Total:</span>
              <span>{formatCurrency(purchase.taxTotal)}</span>
            </div>
            {purchase.shippingCost > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Freight Shipping:</span>
                <span>{formatCurrency(purchase.shippingCost)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Grand Total:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(purchase.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetail;
