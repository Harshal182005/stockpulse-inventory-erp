import React, { useState, useEffect } from 'react';
import { Shield, Save, Check, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const RolesPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/roles');
      if (res.success) {
        setRoles(res.data);
        if (res.data[0]) setSelectedRole(res.data[0]);
      }
    } catch (err) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = (moduleIdx, field) => {
    if (!selectedRole || selectedRole.name === 'admin') return; // Admin always has full access

    setSelectedRole((prev) => {
      const updated = { ...prev };
      const currentVal = updated.permissions[moduleIdx][field];
      updated.permissions[moduleIdx][field] = !currentVal;
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      const res = await api.put(`/users/roles/${selectedRole._id}`, {
        permissions: selectedRole.permissions,
        description: selectedRole.description,
      });
      if (res.success) {
        toast.success(`Permissions updated for ${selectedRole.name}!`);
        fetchRoles();
      }
    } catch (err) {
      toast.error(err.message || 'Error updating permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Role-Based Access Control (RBAC) & Permissions"
        subtitle="Configure module-level authority, export rights, and administrative capabilities across organizational roles"
        breadcrumbs={[{ name: 'System' }, { name: 'Roles & Permissions' }]}
        actions={
          selectedRole?.name !== 'admin' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Permissions Matrix</span>
            </button>
          )
        }
      />

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {roles.map((r) => (
          <div
            key={r._id}
            onClick={() => setSelectedRole(r)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedRole?._id === r._id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider capitalize">
                {r.name}
              </span>
              <Shield className="w-4 h-4 opacity-80" />
            </div>
            <p className={`text-[11px] mt-1 line-clamp-2 ${selectedRole?._id === r._id ? 'text-indigo-100' : 'text-slate-400'}`}>
              {r.description}
            </p>
          </div>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      {selectedRole && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {selectedRole.name} Permission Matrix
              </h3>
              <p className="text-xs text-slate-400">
                {selectedRole.name === 'admin'
                  ? 'Administrators possess permanent full read/write authority across all modules.'
                  : 'Toggle checkboxes below to customize operational authority for this role.'}
              </p>
            </div>
            <Badge variant={selectedRole.name}>{selectedRole.name}</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3 text-center">View</th>
                  <th className="px-4 py-3 text-center">Create</th>
                  <th className="px-4 py-3 text-center">Edit</th>
                  <th className="px-4 py-3 text-center">Delete</th>
                  <th className="px-4 py-3 text-center">Export</th>
                  <th className="px-4 py-3 text-center">Approve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {selectedRole.permissions?.map((perm, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {perm.module}
                    </td>
                    {['view', 'create', 'edit', 'delete', 'export', 'approve'].map((action) => (
                      <td key={action} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          disabled={selectedRole.name === 'admin'}
                          checked={selectedRole.name === 'admin' ? true : Boolean(perm[action])}
                          onChange={() => handleTogglePermission(idx, action)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
