import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-6 shadow-xl shadow-primary-500/10">
        <FileQuestion className="w-10 h-10" />
      </div>

      <span className="text-xs font-bold tracking-widest text-primary-600 uppercase mb-2">404 Error</span>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Page Not Found</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm mb-8">
        The inventory module, invoice, or ledger record you are looking for does not exist or has been relocated.
      </p>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => window.history.back()}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <Link to="/dashboard" className="btn-primary flex items-center space-x-2">
          <Home className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
