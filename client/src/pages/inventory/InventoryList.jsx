import React, { useState, useEffect } from 'react';
import {
  Archive,
  ArrowLeftRight,
  SlidersHorizontal,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Download,
  AlertTriangle,
} from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const InventoryList = () => {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [adjustData, setAdjustData] = useState({
    productId: '',
    quantityChange: 1,
    type: 'IN',
    reason: 'Stock In Arrival',
    warehouseId: '',
  });

  const [transferData, setTransferData] = useState({
    productId: '',
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    quantity: 1,
    reason: 'Inter-warehouse stock rebalancing',
  });

  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, prodRes, whRes] = await Promise.all([
        api.get('/inventory/summary'),
        api.get('/products?limit=100'),
        api.get('/warehouses'),
      ]);
      if (sumRes.success) setSummary(sumRes.data);
      if (prodRes.success) setProducts(prodRes.data);
      if (whRes.success) setWarehouses(whRes.data);
    } catch (err) {
      toast.error('Failed to load inventory summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdjust = (prod = null) => {
    setSelectedProduct(prod);
    setAdjustData({
      productId: prod ? prod._id : products[0]?._id || '',
      quantityChange: 1,
      type: 'IN',
      reason: 'Physical Count Adjustment',
      warehouseId: prod?.warehouse?._id || warehouses[0]?._id || '',
    });
    setAdjustModalOpen(true);
  };

  const handleOpenTransfer = (prod = null) => {
    setSelectedProduct(prod);
    setTransferData({
      productId: prod ? prod._id : products[0]?._id || '',
      sourceWarehouseId: prod?.warehouse?._id || warehouses[0]?._id || '',
      destinationWarehouseId: warehouses[1]?._id || '',
      quantity: 1,
      reason: 'Regional demand replenishment',
    });
    setTransferModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      const qty = adjustData.type === 'OUT' ? -Math.abs(adjustData.quantityChange) : Math.abs(adjustData.quantityChange);
      const res = await api.post('/inventory/adjust', {
        ...adjustData,
        quantityChange: qty,
      });
      if (res.success) {
        toast.success('Stock adjusted successfully');
        setAdjustModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Error adjusting stock');
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory/transfer', transferData);
      if (res.success) {
        toast.success('Stock transferred successfully');
        setTransferModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Error transferring stock');
    }
  };

  const handleExport = () => {
    const formatted = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category?.name,
      CurrentStock: p.currentStock,
      Unit: p.unit,
      CostValuation: p.currentStock * p.purchasePrice,
      RetailValuation: p.currentStock * p.sellingPrice,
      Warehouse: p.warehouse?.name,
    }));
    exportToCSV(formatted, 'inventory_valuation.csv');
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock & Inventory Valuation"
        subtitle="Manage inventory balances, execute stock adjustments, and transfer merchandise between warehouses"
        breadcrumbs={[{ name: 'Inventory' }, { name: 'Stock Overview' }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            {hasRole('admin', 'manager') && (
              <>
                <button
                  onClick={() => handleOpenAdjust()}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Adjust Stock</span>
                </button>
                <button
                  onClick={() => handleOpenTransfer()}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Transfer Stock</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Valuation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Stock On Hand</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summary?.totalStockUnits?.toLocaleString() || 0}{' '}
            <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <span className="text-xs text-slate-400">Across {summary?.totalProducts || 0} active catalog SKUs</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Valuation at Cost (COGS)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(summary?.totalCostValuation || 0)}
          </div>
          <span className="text-xs text-slate-400">Asset capital investment</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Valuation at Retail</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(summary?.totalRetailValuation || 0)}
          </div>
          <span className="text-xs text-slate-400">Expected sales realization</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Potential Gross Profit</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(summary?.potentialProfit || 0)}
          </div>
          <span className="text-xs text-slate-400">Locked inventory margin</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory items..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">{filtered.length} SKUs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Warehouse & Rack</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Cost Valuation</th>
                <th className="px-4 py-3">Retail Valuation</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filtered.map((p) => {
                let badgeVariant = 'in_stock';
                if (p.currentStock <= 0) badgeVariant = 'out_of_stock';
                else if (p.currentStock <= p.minStock) badgeVariant = 'low_stock';

                return (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {p.warehouse?.name || 'Main Warehouse'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Rack {p.rack || '-'} / Shelf {p.shelf || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {p.currentStock} {p.unit}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(p.currentStock * p.purchasePrice)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.currentStock * p.sellingPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={badgeVariant}>{badgeVariant.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {hasRole('admin', 'manager') && (
                        <>
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            title="Adjust Units"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenTransfer(p)}
                            title="Transfer Stock"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Stock Adjustment (Audit Correction / In / Out)"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product *
            </label>
            <select
              required
              value={adjustData.productId}
              onChange={(e) => setAdjustData({ ...adjustData, productId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (SKU: {p.sku}) - Current Stock: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adjustment Type *
              </label>
              <select
                value={adjustData.type}
                onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="IN">Stock In (+ Add Units)</option>
                <option value="OUT">Stock Out (- Deduct Units)</option>
                <option value="ADJUSTMENT">Audit Correction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity Units *
              </label>
              <input
                type="number"
                min="1"
                required
                value={adjustData.quantityChange}
                onChange={(e) => setAdjustData({ ...adjustData, quantityChange: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Memo *
            </label>
            <input
              type="text"
              required
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              placeholder="e.g. Broken in transit, Annual audit count adjustment"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg"
            >
              Execute Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Transfer Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer Stock Between Warehouses"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product *
            </label>
            <select
              required
              value={transferData.productId}
              onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (Current Stock: {p.currentStock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Warehouse *
              </label>
              <select
                required
                value={transferData.sourceWarehouseId}
                onChange={(e) => setTransferData({ ...transferData, sourceWarehouseId: e.target.value })}
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
                Destination Warehouse *
              </label>
              <select
                required
                value={transferData.destinationWarehouseId}
                onChange={(e) => setTransferData({ ...transferData, destinationWarehouseId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transfer Quantity Units *
            </label>
            <input
              type="number"
              min="1"
              required
              value={transferData.quantity}
              onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Shipment Notes
            </label>
            <input
              type="text"
              value={transferData.reason}
              onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
              placeholder="e.g. Replenishing Mumbai depot inventory"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg"
            >
              Confirm Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryList;
