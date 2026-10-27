import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ArrowRight, CheckCircle2, TrendingUp, RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const SmartRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/forecast/recommendations');
      if (res.success) setRecommendations(res.data);
    } catch (err) {
      toast.error('Failed to load AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Smart Inventory Recommendations"
        subtitle="AI-driven prescriptive actions to prevent stockouts, liquidate expiring goods, and optimize working capital"
        breadcrumbs={[{ name: 'Analytics' }, { name: 'Smart Recommendations' }]}
        actions={
          <button
            onClick={fetchRecommendations}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Rerun AI Rules Engine</span>
          </button>
        }
      />

      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Inventory Intelligence Engine Active
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Continuously correlates real-time sales velocity, lead times, batch expirations, and locked inventory cashflow.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
          {recommendations.length} Actionable Recommendations
        </span>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-xs text-slate-400">Synthesizing supply chain recommendations...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Catalog is Fully Optimized</h3>
          <p className="text-xs text-slate-400 mt-1">No urgent stockouts, overstocking, or expiring batches detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <Badge variant={rec.priority}>{rec.priority} Priority</Badge>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {rec.category}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {rec.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Observation:</span> {rec.reason}
                </p>
              </div>

              {/* Action and Estimated Impact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Prescribed Action</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {rec.suggestedAction}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Estimated Impact</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {rec.estimatedImpact}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex justify-end">
                {rec.category === 'Reorder Alert' && (
                  <button
                    onClick={() => navigate('/purchases/orders')}
                    className="flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Create Purchase Order →</span>
                  </button>
                )}
                {rec.category === 'Expiry Clearance' && (
                  <button
                    onClick={() => navigate('/inventory/expiry')}
                    className="flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Inspect Expiry Schedule →</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartRecommendations;
