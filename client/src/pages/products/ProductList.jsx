import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Barcode,
  Package,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BarcodeLabelModal from '../../components/barcode/BarcodeLabelModal';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [stockStatus, setStockStatus] = useState(searchParams.get('stockStatus') || '');
  const [page, setPage] = useState(1);

  // Aux state for categories
  const [categories, setCategories] = useState([]);

  // Modals
  const [selectedProductForPrint, setSelectedProductForPrint] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState('');

  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (stockStatus) params.append('stockStatus', stockStatus);
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, category, stockStatus, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success('Product deleted successfully');
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const handleExport = () => {
    const formatted = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category?.name || '',
      Brand: p.brand?.name || '',
      Barcode: p.barcode || '',
      Stock: p.currentStock,
      Unit: p.unit,
      PurchasePrice: p.purchasePrice,
      SellingPrice: p.sellingPrice,
      TaxRate: p.taxRate,
      Warehouse: p.warehouse?.name || '',
      Status: p.status,
    }));
    exportToCSV(formatted, `products_catalog_${Date.now()}.csv`);
  };

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(importData);
      if (!Array.isArray(parsed)) {
        toast.error('Data must be a JSON array of product objects');
        return;
      }
      const res = await api.post('/products/bulk-import', { products: parsed });
      if (res.success) {
        toast.success(res.message);
        setImportModalOpen(false);
        setImportData('');
        fetchProducts();
      }
    } catch (err) {
      toast.error('Invalid JSON format or import error: ' + err.message);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products Inventory"
        subtitle="Complete catalog with barcode labels, stock level triggers, and warehouse allocation"
        breadcrumbs={[{ name: 'Products' }]}
        actions={
          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {hasRole('admin', 'manager') && (
              <button
                onClick={() => setImportModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk Import</span>
              </button>
            )}

            {hasRole('admin', 'manager') && (
              <button
                onClick={() => navigate('/inventory/products/new')}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        }
      />

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
            placeholder="Search by name, SKU, or barcode..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤ Min)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setCategory('');
              setStockStatus('');
              setPage(1);
            }}
            className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Products Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">Category & Brand</th>
                <th className="px-4 py-3.5">Cost / Price</th>
                <th className="px-4 py-3.5">Current Stock</th>
                <th className="px-4 py-3.5">Warehouse & Shelf</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading product inventory...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-400/50" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No products found</p>
                    <p className="text-[11px] mt-0.5">Try adjusting your search criteria or add a new product</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  let badgeVariant = 'in_stock';
                  if (p.currentStock <= 0) badgeVariant = 'out_of_stock';
                  else if (p.currentStock <= p.minStock) badgeVariant = 'low_stock';

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & SKU */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-indigo-500" />
                            )}
                          </div>
                          <div className="truncate max-w-xs">
                            <button
                              onClick={() => navigate(`/inventory/products/${p._id}`)}
                              className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block text-left"
                            >
                              {p.name}
                            </button>
                            <span className="text-[10px] font-mono text-slate-400">
                              SKU: {p.sku} | Barcode: {p.barcode || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.category?.name || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Brand: {p.brand?.name || 'Standard'}
                        </div>
                      </td>

                      {/* Cost / Selling Price */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(p.sellingPrice)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cost: {formatCurrency(p.purchasePrice)}
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {p.currentStock} {p.unit}
                          </span>
                          <Badge variant={badgeVariant}>
                            {badgeVariant === 'out_of_stock'
                              ? 'Out of Stock'
                              : badgeVariant === 'low_stock'
                              ? 'Low Stock'
                              : 'In Stock'}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Min: {p.minStock} | Max: {p.maxStock}
                        </div>
                      </td>

                      {/* Warehouse & Shelf */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.warehouse?.name || 'Central Hub'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Rack: {p.rack || '-'} | Shelf: {p.shelf || '-'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                            p.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className="capitalize font-medium text-[11px]">{p.status}</span>
                      </td>

                      {/* Action Icons */}
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedProductForPrint(p)}
                          title="Print Barcode Labels"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/inventory/products/${p._id}`)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasRole('admin', 'manager') && (
                          <button
                            onClick={() => navigate(`/inventory/products/${p._id}/edit`)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {hasRole('admin') && (
                          <button
                            onClick={() => setDeleteId(p._id)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* Barcode Printable Labels Modal */}
      <BarcodeLabelModal
        isOpen={!!selectedProductForPrint}
        onClose={() => setSelectedProductForPrint(null)}
        product={selectedProductForPrint}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? All catalog references and history will be affected."
      />

      {/* Bulk Import JSON Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Bulk Import Products via JSON"
      >
        <p className="text-xs text-slate-500 mb-2">
          Paste an array of product JSON objects matching the schema (name, sku, category, purchasePrice, sellingPrice, etc.):
        </p>
        <textarea
          rows={10}
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder='[{"name": "Sample Product", "sku": "SMP-01", "category": "...", "purchasePrice": 100, "sellingPrice": 200, "currentStock": 50}]'
          className="w-full p-3 font-mono text-xs bg-slate-900 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => setImportModalOpen(false)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkImport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg"
          >
            Execute Import
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductList;
