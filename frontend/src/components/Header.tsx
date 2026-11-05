import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { MeridianMonogram } from '../pages/LandingPage';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, role } = useAuth();

  const getBreadcrumb = (pathname: string) => {
    switch (pathname) {
      case '/dashboard': return 'Dashboard';
      case '/directory': return 'Employee Directory';
      case '/employees': return 'Employee Management';
      case '/leave': return 'Leave Management';
      case '/audit-logs': return 'Security Audit Logs';
      case '/profile': return 'My Profile';
      default: return 'Portal';
    }
  };

  return (
    <header className="h-14 border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-ink-900 px-6 flex items-center justify-between z-10 shrink-0 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[12px] font-medium text-ink-500 dark:text-parchment-400">
          <MeridianMonogram size={18} className="text-ink-900 dark:text-parchment-50" />
          <span>Meridian</span>
        </div>
        <span className="text-black/[0.15] dark:text-white/[0.15] font-light">/</span>
        <h1 className="text-[13px] font-semibold text-ink-900 dark:text-parchment-50 tracking-tight">
          {getBreadcrumb(location.pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Subtle System Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-parchment-100 dark:bg-ink-850 border border-black/[0.06] dark:border-white/[0.08] font-mono text-[10px] uppercase tracking-wider text-ink-600 dark:text-parchment-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Operational</span>
        </div>

        {role && (
          <Badge variant="role" value={role} />
        )}

        <div className="text-[12px] text-ink-600 dark:text-parchment-300 font-medium hidden md:block">
          {user?.fullName || user?.email}
        </div>
      </div>
    </header>
  );
};

export default Header;
