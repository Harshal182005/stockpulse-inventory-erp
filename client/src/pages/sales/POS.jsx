import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  User,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  Printer,
  X,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/invoicePdf';
import toast from 'react-hot-toast';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // null = Walk-in
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Held Carts
  const [heldCarts, setHeldCarts] = useState([]);

  // Checkout Modal & Success State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  const barcodeRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, custRes, catRes] = await Promise.all([
        api.get('/products?limit=200&status=active'),
        api.get('/customers?limit=100'),
        api.get('/categories'),
      ]);
      if (prodRes.success) setProducts(prodRes.data);
      if (custRes.success) setCustomers(custRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      toast.error('Failed to initialize POS terminal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Barcode Scanning listener
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const match = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query) ||
        p.sku.toLowerCase() === query
    );

    if (match) {
      addToCart(match);
      setBarcodeInput('');
      toast.success(`Scanned: ${match.name}`);
    } else {
      toast.error(`No product matches barcode: ${barcodeInput}`);
    }
  };

  const addToCart = (product) => {
    if (product.currentStock <= 0) {
      toast.error(`"${product.name}" is OUT OF STOCK!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          toast.error(`Max available stock reached (${product.currentStock} units)`);
          return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: product.discount || 0 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.currentStock) {
              toast.error(`Cannot exceed current stock of ${item.product.currentStock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountPercent(0);
  };

  // Hold current cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const held = {
      id: Date.now(),
      cart,
      customer: selectedCustomer,
      timestamp: new Date(),
    };
    setHeldCarts((prev) => [...prev, held]);
    clearCart();
    toast.success('Sale placed on hold');
  };

  // Resume held cart
  const handleResumeCart = (held) => {
    setCart(held.cart);
    setSelectedCustomer(held.customer);
    setHeldCarts((prev) => prev.filter((h) => h.id !== held.id));
    toast.success('Held sale resumed');
  };

  // Calculations
  let subtotal = 0;
  let taxTotal = 0;

  cart.forEach((item) => {
    const itemSubtotal = item.quantity * item.product.sellingPrice;
    const itemDisc = (itemSubtotal * (item.discount || 0)) / 100;
    const taxable = itemSubtotal - itemDisc;
    const itemTax = (taxable * (item.product.taxRate || 0)) / 100;

    subtotal += itemSubtotal;
    taxTotal += itemTax;
  });

  const cartDiscountAmount = (subtotal * discountPercent) / 100;
  const grandTotal = Math.max(0, subtotal - cartDiscountAmount + taxTotal);

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setPaidAmount(grandTotal);
    setCheckoutModalOpen(true);
  };

  const handleCompleteSale = async () => {
    try {
      setCompleting(true);
      const payload = {
        customerId: selectedCustomer?._id || undefined,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone || '',
        items: cart.map((i) => ({
          product: i.product._id,
          productName: i.product.name,
          sku: i.product.sku,
          quantity: i.quantity,
          unitPrice: i.product.sellingPrice,
          discount: i.discount || 0,
          taxRate: i.product.taxRate || 0,
        })),
        subtotal,
        discountTotal: cartDiscountAmount,
        taxTotal,
        paymentMethod,
        paidAmount: Number(paidAmount) || grandTotal,
        saleStatus: 'completed',
      };

      const res = await api.post('/sales', payload);
      if (res.success) {
        toast.success('Sale completed successfully!');
        setCompletedInvoice(res.data.invoice);
        setCheckoutModalOpen(false);
        clearCart();
        fetchData(); // Refresh stock counts in background
      }
    } catch (err) {
      toast.error(err.message || 'Error completing checkout');
    } finally {
      setCompleting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchesCategory = selectedCategory ? p.category?._id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <span>POS Checkout Terminal</span>
          </h1>
          <p className="text-xs text-slate-400">High-velocity sales billing, barcode scanning, and instant invoice generation</p>
        </div>

        {/* Barcode Quick Scan Input */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              ref={barcodeRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode / Enter SKU (Enter to add)..."
              className="pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl w-64 sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            Scan
          </button>
        </form>
      </div>

      {/* Main Split Layout: Catalog on Left, Cart Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Product Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Pills & Search */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === ''
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === c._id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const inStock = p.currentStock > 0;
              return (
                <div
                  key={p._id}
                  onClick={() => inStock && addToCart(p)}
                  className={`p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-150 ${
                    inStock
                      ? 'cursor-pointer hover:border-indigo-500 hover:shadow-md active:scale-98'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase truncate">
                        {p.sku}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          inStock
                            ? p.currentStock <= p.minStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inStock ? `${p.currentStock} left` : 'Out of Stock'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(p.sellingPrice)}
                    </span>
                    <button
                      type="button"
                      disabled={!inStock}
                      className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart & Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Active Cart ({cart.reduce((a, c) => a + c.quantity, 0)} Items)
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {cart.length > 0 && (
                  <>
                    <button
                      onClick={handleHoldCart}
                      title="Place on Hold"
                      className="p-1 text-slate-400 hover:text-amber-500 rounded-lg"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                    <button
                      onClick={clearCart}
                      title="Clear Cart"
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Customer Selector */}
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <select
                  value={selectedCustomer?._id || ''}
                  onChange={(e) => {
                    const cust = customers.find((c) => c._id === e.target.value);
                    setSelectedCustomer(cust || null);
                  }}
                  className="w-full text-xs bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-3 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">Cart is currently empty</p>
                  <p className="text-[10px] mt-0.5">Click products or scan barcodes to begin</p>
                </div>
              ) : (
                cart.map((item) => {
                  const lineTotal = item.quantity * item.product.sellingPrice;
                  return (
                    <div key={item.product._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="truncate max-w-[150px] sm:max-w-[180px]">
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {item.product.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatCurrency(item.product.sellingPrice)} × {item.quantity}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product._id, -1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-slate-900 dark:text-white text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product._id, 1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-black text-slate-900 dark:text-white w-16 text-right">
                          {formatCurrency(lineTotal)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product._id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Calculations & Checkout Button */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Discount (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-14 px-1.5 py-0.5 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                />
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax / GST:</span>
                <span>+{formatCurrency(taxTotal)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-base font-black text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-indigo-600 dark:text-indigo-400 text-xl font-black">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleOpenCheckout}
                className="w-full mt-3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 disabled:opacity-50 shadow-md flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Payment</span>
              </button>
            </div>
          </div>

          {/* Held Carts Panel */}
          {heldCarts.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                Held Transactions ({heldCarts.length})
              </span>
              <div className="space-y-1.5">
                {heldCarts.map((held) => (
                  <div
                    key={held.id}
                    className="p-2 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-between text-xs border border-slate-200 dark:border-slate-800"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {held.customer?.name || 'Walk-in'} ({held.cart.length} items)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Held at {new Date(held.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResumeCart(held)}
                      className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Resume</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Payment Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Complete POS Sale & Payment"
      >
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                Payable Grand Total
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(grandTotal)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              Customer: <span className="font-bold text-slate-900 dark:text-white">{selectedCustomer?.name || 'Walk-in'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Settlement Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'upi', 'card', 'bank_transfer', 'credit'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-2.5 rounded-xl border text-xs font-bold uppercase transition-all ${
                    paymentMethod === method
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {method.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Received Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full px-3 py-2 text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {Number(paidAmount) > grandTotal && (
              <p className="text-xs text-emerald-600 font-bold mt-1">
                Change to return: {formatCurrency(Number(paidAmount) - grandTotal)}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setCheckoutModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={completing}
              onClick={handleCompleteSale}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-lg transition-colors flex items-center space-x-1"
            >
              {completing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Authorize & Print Receipt</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Sale Success & Invoice Receipt Modal */}
      <Modal
        isOpen={!!completedInvoice}
        onClose={() => setCompletedInvoice(null)}
        title="Sale Completed Successfully!"
      >
        {completedInvoice && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Invoice {completedInvoice.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Settled: {formatCurrency(completedInvoice.grandTotal)} ({completedInvoice.paymentMethod})
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold">{completedInvoice.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Items:</span>
                <span>{completedInvoice.items?.length} items</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => generateInvoicePDF(completedInvoice)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1"
              >
                <Printer className="w-4 h-4" />
                <span>Download PDF Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedInvoice(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default POS;
