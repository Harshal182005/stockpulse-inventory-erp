import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, ShoppingCart, RefreshCw, Calculator } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const PurchaseCreate = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [orderStatus, setOrderStatus] = useState('ordered');
  const [paidAmount, setPaidAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');

  // Item rows
  const [items, setItems] = useState([
    { product: '', quantity: 1, unitCost: 0, taxRate: 18, discount: 0 },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        const [suppRes, whRes, prodRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/warehouses'),
          api.get('/products?limit=200'),
        ]);
        if (suppRes.success) {
          setSuppliers(suppRes.data);
          if (suppRes.data[0]) setSupplierId(suppRes.data[0]._id);
        }
        if (whRes.success) {
          setWarehouses(whRes.data);
          if (whRes.data[0]) setWarehouseId(whRes.data[0]._id);
        }
        if (prodRes.success) setProducts(prodRes.data);
      } catch (err) {
        toast.error('Failed to load purchase form dependencies');
      }
    };

    fetchPrerequisites();
  }, []);

  const handleProductSelect = (index, prodId) => {
    const selectedProd = products.find((p) => p._id === prodId);
    const updated = [...items];
    updated[index].product = prodId;
    if (selectedProd) {
      updated[index].unitCost = selectedProd.purchasePrice || 0;
      updated[index].taxRate = selectedProd.taxRate || 18;
    }
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = Number(value);
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { product: '', quantity: 1, unitCost: 0, taxRate: 18, discount: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Dynamic calculations
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  items.forEach((item) => {
    const base = (item.quantity || 0) * (item.unitCost || 0);
    const disc = (base * (item.discount || 0)) / 100;
    const taxable = base - disc;
    const tax = (taxable * (item.taxRate || 0)) / 100;

    subtotal += base;
    discountTotal += disc;
    taxTotal += tax;
  });

  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal + Number(shippingCost));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !warehouseId) {
      toast.error('Supplier and Warehouse are required');
      return;
    }

    const validItems = items.filter((i) => i.product && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid product item');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/purchases', {
        supplier: supplierId,
        warehouse: warehouseId,
        items: validItems,
        shippingCost: Number(shippingCost),
        paidAmount: Number(paidAmount),
        orderStatus,
        notes,
      });

      if (res.success) {
        toast.success(`Purchase Order created successfully!`);
        navigate('/purchases/orders');
      }
    } catch (err) {
      toast.error(err.message || 'Error creating purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Create Purchase Order"
        subtitle="Issue procurement order to supplier and configure delivery warehouse"
        breadcrumbs={[{ name: 'Purchases', path: '/purchases/orders' }, { name: 'New PO' }]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/purchases/orders')}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier & Warehouse Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Vendor & Destination Hub
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supplier Vendor *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.companyName} ({s.paymentTerms})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receiving Warehouse *
              </label>
              <select
                required
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Order Status
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="ordered">Ordered (Awaiting Delivery)</option>
                <option value="received">Received (Immediately Add to Stock)</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Item Rows Builder */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ordered Products
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((row, index) => {
              const itemTotal = (row.quantity * row.unitCost * (1 - row.discount / 100) * (1 + row.taxRate / 100)).toFixed(2);

              return (
                <div
                  key={index}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Product
                    </label>
                    <select
                      required
                      value={row.product}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (SKU: {p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={row.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Unit Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={row.unitCost}
                      onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Tax %
                    </label>
                    <input
                      type="number"
                      value={row.taxRate}
                      onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 text-right">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Subtotal
                    </label>
                    <div className="text-xs font-bold text-slate-900 dark:text-white py-1.5">
                      {formatCurrency(itemTotal)}
                    </div>
                  </div>

                  <div className="sm:col-span-1 text-center">
                    <button
                      type="button"
                      disabled={items.length === 1}
                      onClick={() => removeItemRow(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calculation Summary & Payment Allocation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400">Order Notes & Terms</h3>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery instructions, dock gate number, batch requirements..."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Advance Paid Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">
                Any advance payment will automatically disburse a payment record and update supplier balance.
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400">Fiscal Breakdown</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal (Base Items):</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Item Discounts:</span>
                <span>-{formatCurrency(discountTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax / GST:</span>
                <span>+{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Shipping / Freight Cost:</span>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-24 px-2 py-1 text-right text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-base font-bold text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-lg">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Issue Purchase Order</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseCreate;
