import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Search, Truck, Download, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PurchaseReturns = () => {
  const [returns, setReturns] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [notes, setNotes] = useState('');

  const { hasRole } = useAuth();

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-returns');
      if (res.success) setReturns(res.data);
    } catch (err) {
      toast.error('Failed to load purchase returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await api.get('/purchases?limit=50');
      if (res.success) setPurchases(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchPurchases();
  }, []);

  const handleSelectPurchase = (poId) => {
    setSelectedPurchaseId(poId);
    const po = purchases.find((p) => p._id === poId);
    if (po && po.items) {
      setReturnItems(
        po.items.map((i) => ({
          product: i.product?._id || i.product,
          productName: i.productName,
          sku: i.sku,
          unitCost: i.unitCost,
          maxQty: i.quantity,
          quantity: 0,
          reason: 'Defective/Damaged in delivery',
        }))
      );
    }
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...returnItems];
    updated[index].quantity = Math.max(0, Math.min(updated[index].maxQty, parseInt(qty) || 0));
    setReturnItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const po = purchases.find((p) => p._id === selectedPurchaseId);
    if (!po) return;

    const itemsToReturn = returnItems.filter((i) => i.quantity > 0);
    if (itemsToReturn.length === 0) {
      toast.error('Select at least one product quantity to return');
      return;
    }

    try {
      const res = await api.post('/purchase-returns', {
        purchaseId: po._id,
        supplierId: po.supplier?._id || po.supplier,
        items: itemsToReturn,
        notes,
      });

      if (res.success) {
        toast.success('Purchase Return logged & inventory adjusted!');
        setModalOpen(false);
        fetchReturns();
      }
    } catch (err) {
      toast.error(err.message || 'Error processing purchase return');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Returns Management"
        subtitle="Process damaged/defective merchandise returns back to vendors and credit supplier ledgers"
        breadcrumbs={[{ name: 'Purchases', path: '/purchases/orders' }, { name: 'Returns' }]}
        actions={
          hasRole('admin', 'manager') && (
            <button
              onClick={() => {
                setSelectedPurchaseId(purchases[0]?._id || '');
                if (purchases[0]) handleSelectPurchase(purchases[0]._id);
                setModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Vendor Return</span>
            </button>
          )
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Return #</th>
                <th className="px-4 py-3">PO Reference</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Items Returned</th>
                <th className="px-4 py-3">Total Refund Value</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading return log...</span>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No vendor returns recorded.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold font-mono text-rose-600 dark:text-rose-400">
                      {ret.returnNumber}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {ret.purchase?.purchaseNumber || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {ret.supplier?.companyName || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {ret.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(ret.totalRefund)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(ret.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="completed">Completed</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Vendor Return Record"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Purchase Order to Return From *
            </label>
            <select
              required
              value={selectedPurchaseId}
              onChange={(e) => handleSelectPurchase(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">Select PO</option>
              {purchases.map((po) => (
                <option key={po._id} value={po._id}>
                  {po.purchaseNumber} - {po.supplier?.companyName} ({formatCurrency(po.grandTotal)})
                </option>
              ))}
            </select>
          </div>

          {returnItems.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase text-slate-400 block">
                Select Quantity to Return Back:
              </span>
              {returnItems.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{item.productName}</div>
                    <div className="text-[10px] text-slate-400">
                      SKU: {item.sku} | Unit Cost: {formatCurrency(item.unitCost)} | Max Purchased: {item.maxQty}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Return Qty:</label>
                    <input
                      type="number"
                      min="0"
                      max={item.maxQty}
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(index, e.target.value)}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-center font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Return Reason / Vendor RMA Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Defective board components, damaged on freight transit"
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white rounded-lg"
            >
              Confirm Return & Adjust Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseReturns;
