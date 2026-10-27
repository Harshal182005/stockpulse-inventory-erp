import React, { useState, useEffect } from 'react';
import { Plus, Search, Warehouse, Edit, Trash2, Eye, MapPin, Phone, Mail, Package } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    manager: '',
    phone: '',
    email: '',
    capacity: 10000,
    address: { street: '', city: '', state: '', zipCode: '' },
    status: 'active',
  });
  const [deleteId, setDeleteId] = useState(null);

  // View inventory modal
  const [viewWarehouse, setViewWarehouse] = useState(null);
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  const { hasRole } = useAuth();

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warehouses');
      if (res.success) setWarehouses(res.data);
    } catch (err) {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenModal = (wh = null) => {
    if (wh) {
      setEditWarehouse(wh);
      setFormData({
        name: wh.name,
        code: wh.code,
        manager: wh.manager || '',
        phone: wh.phone || '',
        email: wh.email || '',
        capacity: wh.capacity || 10000,
        address: wh.address || { street: '', city: '', state: '', zipCode: '' },
        status: wh.status || 'active',
      });
    } else {
      setEditWarehouse(null);
      setFormData({
        name: '',
        code: '',
        manager: '',
        phone: '',
        email: '',
        capacity: 10000,
        address: { street: '', city: '', state: '', zipCode: '' },
        status: 'active',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editWarehouse) {
        await api.put(`/warehouses/${editWarehouse._id}`, formData);
        toast.success('Warehouse updated successfully');
      } else {
        await api.post('/warehouses', formData);
        toast.success('Warehouse created successfully');
      }
      setModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.message || 'Error saving warehouse');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/warehouses/${deleteId}`);
      toast.success('Warehouse deleted');
      setDeleteId(null);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.message || 'Failed to delete warehouse');
    }
  };

  const handleViewInventory = async (wh) => {
    setViewWarehouse(wh);
    try {
      setViewLoading(true);
      const res = await api.get(`/warehouses/${wh._id}/inventory`);
      if (res.success) setWarehouseProducts(res.products);
    } catch (err) {
      toast.error('Failed to load warehouse inventory');
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Facilities & Depots"
        subtitle="Manage regional distribution centers, storage capacity utilization, and stock locations"
        breadcrumbs={[{ name: 'Inventory' }, { name: 'Warehouses' }]}
        actions={
          hasRole('admin', 'manager') && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Warehouse</span>
            </button>
          )
        }
      />

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div
            key={wh._id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{wh.name}</h3>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      CODE: {wh.code}
                    </span>
                  </div>
                </div>

                {hasRole('admin', 'manager') && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenModal(wh)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {hasRole('admin') && (
                      <button
                        onClick={() => setDeleteId(wh._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Address & Manager */}
              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">
                    {wh.address?.street ? `${wh.address.street}, ${wh.address.city}` : 'No address on record'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Manager:</span>
                  <span>{wh.manager || 'Unassigned'}</span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">Capacity Utilization</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {wh.utilizationPercentage || 0}% ({wh.totalStockUnits || 0} / {wh.capacity || 10000} units)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      wh.utilizationPercentage > 85
                        ? 'bg-rose-500'
                        : wh.utilizationPercentage > 60
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, wh.utilizationPercentage || 0)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Inventory Value</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(wh.totalValuation || 0)}
                </span>
              </div>
              <button
                onClick={() => handleViewInventory(wh)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View SKUs ({wh.totalItemsCount || 0})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Warehouse Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Warehouse Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. West Coast Distribution Depot"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Facility Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. WH-WEST-02"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Facility Manager Name
              </label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                placeholder="e.g. Anil Desai"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maximum Storage Capacity (Units)
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg"
            >
              Save Warehouse
            </button>
          </div>
        </form>
      </Modal>

      {/* Warehouse Products Modal */}
      <Modal
        isOpen={!!viewWarehouse}
        onClose={() => setViewWarehouse(null)}
        title={`Stock in ${viewWarehouse?.name || 'Warehouse'}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Product Name</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Stock Level</th>
                  <th className="px-3 py-2">Rack / Shelf</th>
                  <th className="px-3 py-2">Retail Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {warehouseProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-400">
                      No products currently allocated to this warehouse.
                    </td>
                  </tr>
                ) : (
                  warehouseProducts.map((p) => (
                    <tr key={p._id}>
                      <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="px-3 py-2 font-mono">{p.sku}</td>
                      <td className="px-3 py-2 font-bold">
                        {p.currentStock} {p.unit}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        Rack {p.rack || '-'} / Shelf {p.shelf || '-'}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.currentStock * p.sellingPrice)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? (Cannot be deleted if active stock remains inside)."
      />
    </div>
  );
};

export default WarehouseList;
