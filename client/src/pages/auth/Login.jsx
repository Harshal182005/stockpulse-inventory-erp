import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Archive, Lock, Mail, ArrowRight, Loader2, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <Archive className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Stock<span className="text-indigo-400">Pulse</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Enterprise Inventory Platform
            </span>
          </div>
        </div>

        <h2 className="mt-6 text-center text-xl font-bold text-slate-100">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Streamlined inventory management, billing & demand intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/60">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@inventory.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 text-slate-100 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 text-slate-100 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-700/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Quick 1-Click Demo Login:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@inventory.com', 'Admin@123')}
                className="p-2 rounded-lg bg-slate-700/60 hover:bg-indigo-600/30 border border-slate-600/60 text-left transition-colors group"
              >
                <div className="text-[11px] font-bold text-indigo-300 group-hover:text-indigo-200">👑 Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@inventory.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('manager@inventory.com', 'Manager@123')}
                className="p-2 rounded-lg bg-slate-700/60 hover:bg-indigo-600/30 border border-slate-600/60 text-left transition-colors group"
              >
                <div className="text-[11px] font-bold text-emerald-300 group-hover:text-emerald-200">📊 Manager</div>
                <div className="text-[10px] text-slate-400 truncate">manager@inventory.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('staff@inventory.com', 'Staff@123')}
                className="p-2 rounded-lg bg-slate-700/60 hover:bg-indigo-600/30 border border-slate-600/60 text-left transition-colors group"
              >
                <div className="text-[11px] font-bold text-sky-300 group-hover:text-sky-200">🛒 Staff (POS)</div>
                <div className="text-[10px] text-slate-400 truncate">staff@inventory.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('accountant@inventory.com', 'Accountant@123')}
                className="p-2 rounded-lg bg-slate-700/60 hover:bg-indigo-600/30 border border-slate-600/60 text-left transition-colors group"
              >
                <div className="text-[11px] font-bold text-purple-300 group-hover:text-purple-200">💰 Accountant</div>
                <div className="text-[10px] text-slate-400 truncate">accountant@inventory.com</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400">
              Don't have an enterprise account?{' '}
              <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                Create Account
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
