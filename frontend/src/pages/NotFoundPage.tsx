import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded border border-slate-200 shadow-card p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-[20px] font-bold text-slate-900">
          404 - Page Not Found
        </h1>
        <p className="text-[13px] text-slate-500">
          The requested path does not exist in the Meridian portal directory.
        </p>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

