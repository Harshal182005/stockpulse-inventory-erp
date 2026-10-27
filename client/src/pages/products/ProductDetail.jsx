import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Printer,
  Package,
  Layers,
  Truck,
  Warehouse,
  History,
  Barcode as BarcodeIcon,
  QrCode,
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import BarcodeViewer from '../../components/barcode/BarcodeViewer';
import QRViewer from '../../components/barcode/QRViewer';
import BarcodeLabelModal from '../../components/barcode/BarcodeLabelModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const [prodRes, histRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/history`),
        ]);
        if (prodRes.success) setProduct(prodRes.data);
        if (histRes.success) setHistory(histRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
        <p className="text-xs text-slate-400">Loading product telemetry...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Product not found</p>
        <button
          onClick={() => navigate('/inventory/products')}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const profitMargin = product.sellingPrice > 0
    ? (((product.sellingPrice - product.purchasePrice) / product.sellingPrice) * 100).toFixed(1)
    : 0;

  let stockBadge = 'in_stock';
  if (product.currentStock <= 0) stockBadge = 'out_of_stock';
  else if (product.currentStock <= product.minStock) stockBadge = 'low_stock';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={product.name}
        subtitle={`SKU: ${product.sku} | Barcode: ${product.barcode || '-'}`}
        breadcrumbs={[{ name: 'Products', path: '/inventory/products' }, { name: product.name }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/inventory/products')}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setPrintModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Labels</span>
            </button>
            {hasRole('admin', 'manager') && (
              <button
                onClick={() => navigate(`/inventory/products/${product._id}/edit`)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Product</span>
              </button>
            )}
          </div>
        }
      />

      {/* Main Product Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Info & Identifiers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {product.category?.name || 'General Category'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {product.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {product.description || 'No description provided for this catalog item.'}
                </p>
              </div>
              <Badge variant={stockBadge}>
                {stockBadge === 'out_of_stock'
                  ? 'Out of Stock'
                  : stockBadge === 'low_stock'
                  ? 'Low Stock Warning'
                  : 'In Stock'}
              </Badge>
            </div>

            {/* Price & Economics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Selling Price</span>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatCurrency(product.sellingPrice)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cost Price</span>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatCurrency(product.purchasePrice)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Gross Margin</span>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {profitMargin}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tax / GST</span>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {product.taxRate}%
                </div>
              </div>
            </div>

            {/* Warehouse Allocation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Warehouse</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {product.warehouse?.name || 'Central Hub'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Rack & Shelf</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Rack {product.rack || '-'} / Shelf {product.shelf || '-'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Batch Number</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {product.batchNumber || '-'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Supplier</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {product.supplier?.companyName || 'Standard Supplier'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Manufacture Date</span>
                <span className="text-xs font-medium text-slate-900 dark:text-white">
                  {formatDate(product.mfgDate)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Expiry Date</span>
                <span className="text-xs font-medium text-slate-900 dark:text-white">
                  {formatDate(product.expiryDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Stock Movements Audit History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <History className="w-4 h-4 text-indigo-500" />
              <span>Stock Movement Audit Trail</span>
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No stock movement history recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Stock Balance</th>
                      <th className="px-3 py-2">Reason / Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.map((mov) => (
                      <tr key={mov._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 text-slate-500">{formatDate(mov.createdAt, true)}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mov.type === 'IN' || mov.type === 'PURCHASE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : mov.type === 'OUT' || mov.type === 'SALE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-bold">
                          {mov.quantity} {product.unit}
                        </td>
                        <td className="px-3 py-2.5 font-mono">
                          {mov.previousStock} → <span className="font-bold">{mov.newStock}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{mov.reason || mov.referenceId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Barcodes, QR Code & Inventory Gauges */}
        <div className="space-y-6">
          {/* Stock Level Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Current Stock On Hand</span>
            <div className="text-4xl font-black text-slate-900 dark:text-white mt-1">
              {product.currentStock}{' '}
              <span className="text-sm font-semibold text-slate-400">{product.unit}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Min</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{product.minStock}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Reorder</span>
                <div className="font-bold text-indigo-600 dark:text-indigo-400">{product.reorderLevel}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Max</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{product.maxStock}</div>
              </div>
            </div>
          </div>

          {/* Barcode & QR Code Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scannable Identifiers
            </h3>

            {/* Barcode SVG */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-mono text-slate-500 mb-2">Linear Barcode (1D)</span>
              <BarcodeViewer value={product.barcode || product.sku} width={1.4} height={42} />
            </div>

            {/* QR Code SVG */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-mono text-slate-500 mb-2">QR Code (2D Matrix)</span>
              <QRViewer value={product.barcode || product.sku} size={90} />
            </div>

            <button
              onClick={() => setPrintModalOpen(true)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Print Sticker Labels
            </button>
          </div>
        </div>
      </div>

      <BarcodeLabelModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        product={product}
      />
    </div>
  );
};

export default ProductDetail;
