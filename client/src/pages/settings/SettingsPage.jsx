import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import toast from 'react-hot-toast';
import {
  Building2,
  FileText,
  Bell,
  Save,
  Loader2,
  RefreshCw,
  Percent,
  CheckCircle2,
  Hash,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  const [formData, setFormData] = useState({
    business: {
      name: '',
      legalName: '',
      email: '',
      phone: '',
      address: '',
      gstNumber: '',
      currency: 'INR',
      currencySymbol: '₹',
      logoUrl: '',
    },
    invoice: {
      prefix: 'INV',
      purchasePrefix: 'PO',
      startingNumber: 1001,
      defaultTaxRate: 18,
      termsAndConditions: '',
      footerText: '',
    },
    notification: {
      lowStockThreshold: 10,
      expiryAlertDays: 30,
      emailAlertsEnabled: true,
    },
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.success && res.data) {
        setFormData({
          business: { ...formData.business, ...(res.data.business || {}) },
          invoice: { ...formData.invoice, ...(res.data.invoice || {}) },
          notification: { ...formData.notification, ...(res.data.notification || {}) },
        });
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/settings', formData);
      if (res.success) {
        toast.success('System settings saved successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-9 h-9 animate-spin text-primary-600 mb-3" />
        <p className="text-sm text-slate-500">Loading system settings...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'business', label: 'Company Profile', icon: Building2 },
    { id: 'invoice', label: 'Billing & Invoicing', icon: FileText },
    { id: 'notification', label: 'Alerts & Thresholds', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Manage global organizational details, invoicing parameters, and automated alert criteria"
        breadcrumbs={[{ label: 'System' }, { label: 'Settings' }]}
        actions={
          <button
            type="submit"
            form="settings-form"
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Tabs */}
        <div className="w-full lg:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shadow-sm border border-primary-200/50 dark:border-primary-800/40'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="flex-1">
          <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'business' && (
              <div className="card space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Organization Details</h3>
                  <p className="text-sm text-slate-500">Legal business entity name and tax details printed on invoices.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Business / Brand Name *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.business.name}
                      onChange={(e) => handleChange('business', 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Legal Registered Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.business.legalName}
                      onChange={(e) => handleChange('business', 'legalName', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">Business Email *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        className="input pl-9"
                        value={formData.business.email}
                        onChange={(e) => handleChange('business', 'email', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Official Phone</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        className="input pl-9"
                        value={formData.business.phone}
                        onChange={(e) => handleChange('business', 'phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">GST / Tax Identification Number</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        className="input pl-9 uppercase"
                        value={formData.business.gstNumber}
                        onChange={(e) => handleChange('business', 'gstNumber', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Currency Code</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.business.currency}
                        onChange={(e) => handleChange('business', 'currency', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Currency Symbol</label>
                      <input
                        type="text"
                        className="input text-center font-bold"
                        value={formData.business.currencySymbol}
                        onChange={(e) => handleChange('business', 'currencySymbol', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Corporate Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <textarea
                        rows="3"
                        className="input pl-9 resize-none"
                        value={formData.business.address}
                        onChange={(e) => handleChange('business', 'address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="card space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Invoicing & Billing Defaults</h3>
                  <p className="text-sm text-slate-500">Configure automated invoice numbering sequences and standard terms.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Sales Invoice Prefix</label>
                    <input
                      type="text"
                      className="input uppercase"
                      value={formData.invoice.prefix}
                      onChange={(e) => handleChange('invoice', 'prefix', e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">e.g. INV-2026-0001</p>
                  </div>
                  <div>
                    <label className="label">Purchase Order Prefix</label>
                    <input
                      type="text"
                      className="input uppercase"
                      value={formData.invoice.purchasePrefix}
                      onChange={(e) => handleChange('invoice', 'purchasePrefix', e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">e.g. PO-2026-0001</p>
                  </div>
                  <div>
                    <label className="label">Default GST Rate (%)</label>
                    <div className="relative">
                      <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="input"
                        value={formData.invoice.defaultTaxRate}
                        onChange={(e) => handleChange('invoice', 'defaultTaxRate', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="label">Standard Terms & Conditions</label>
                    <textarea
                      rows="4"
                      className="input font-mono text-xs"
                      value={formData.invoice.termsAndConditions}
                      onChange={(e) => handleChange('invoice', 'termsAndConditions', e.target.value)}
                      placeholder="Terms printed at the footer of official PDF bills..."
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="label">Invoice Footer Greeting</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.invoice.footerText}
                      onChange={(e) => handleChange('invoice', 'footerText', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notification' && (
              <div className="card space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Alerts & Intelligence Thresholds</h3>
                  <p className="text-sm text-slate-500">Configure when low stock triggers alerts and expiry countdown alerts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Global Low Stock Threshold</h4>
                        <p className="text-xs text-slate-500">Default fallback when product-specific reorder point is unset.</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <label className="label">Minimum Stock Units</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={formData.notification.lowStockThreshold}
                        onChange={(e) => handleChange('notification', 'lowStockThreshold', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Expiry Alert Window</h4>
                        <p className="text-xs text-slate-500">Days prior to expiry when urgent badge & notification trigger.</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <label className="label">Days Prior to Expiry</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={formData.notification.expiryAlertDays}
                        onChange={(e) => handleChange('notification', 'expiryAlertDays', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Automated Email Dispatches</h4>
                      <p className="text-xs text-slate-500">Send automatic email notifications to admins when stock falls below critical levels.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.notification.emailAlertsEnabled}
                        onChange={(e) => handleChange('notification', 'emailAlertsEnabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
