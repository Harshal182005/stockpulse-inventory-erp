import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

const NotificationList = () => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
      toast.success('Notification removed');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Notifications & System Alerts"
        subtitle="Centralized activity feed for low stock alerts, batch expirations, payment receipts, and PO delivery logs"
        breadcrumbs={[{ name: 'System' }, { name: 'Notifications' }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mark All as Read</span>
            </button>
            <button
              onClick={fetchNotifications}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'read' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Archived / Read
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">No notifications matching criteria</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n._id}
              onClick={() => {
                if (!n.isRead) markAsRead(n._id);
                if (n.link) navigate(n.link);
              }}
              className={`p-4 flex items-start justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                !n.isRead ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                  <Bell className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </span>
                    <Badge variant={n.priority}>{n.priority}</Badge>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    {formatDate(n.createdAt, true)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                {n.link && (
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                    <span>Inspect</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDelete(n._id, e)}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
