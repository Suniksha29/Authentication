import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck2,
  FileText,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MeridianMonogram } from '../pages/LandingPage';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { user, isAdmin, isHR, logout } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Employee Directory',
      to: '/directory',
      icon: Users,
      visible: true,
    },
    {
      label: 'Manage Employees',
      to: '/employees',
      icon: UserCheck,
      visible: isAdmin || isHR,
      badge: 'HR/Admin',
    },
    {
      label: 'Leave Management',
      to: '/leave',
      icon: CalendarCheck2,
      visible: true,
    },
    {
      label: 'Audit Logs',
      to: '/audit-logs',
      icon: FileText,
      visible: isAdmin,
      badge: 'Admin',
    },
    {
      label: 'My Profile',
      to: '/profile',
      icon: User,
      visible: true,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-ink-900 transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <MeridianMonogram size={24} className="text-ink-900 dark:text-parchment-50 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-[14px] tracking-[-0.02em] text-ink-900 dark:text-parchment-50 leading-none">
                Meridian
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-500 dark:text-parchment-400 mt-0.5">
                Workforce OS
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <MeridianMonogram size={24} className="text-ink-900 dark:text-parchment-50 shrink-0" />
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-parchment-100 dark:bg-ink-800 text-ink-950 dark:text-parchment-50 font-semibold border-l-2 border-copper-600 dark:border-copper-500'
                      : 'text-ink-600 dark:text-parchment-300 hover:text-ink-950 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  } ${collapsed ? 'justify-center px-0 border-l-0' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-parchment-100 dark:bg-ink-850 text-ink-600 dark:text-parchment-400 border border-black/[0.06] dark:border-white/[0.08]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-parchment-50/60 dark:bg-ink-950/60">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full border border-black/[0.1] dark:border-white/[0.1] shrink-0 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-ink-100 dark:bg-ink-800 text-ink-800 dark:text-parchment-200 flex items-center justify-center text-[12px] font-semibold shrink-0">
                  {user?.firstName?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-ink-900 dark:text-parchment-50 truncate">
                  {user?.fullName || 'User'}
                </div>
                <div className="text-[11px] text-ink-500 dark:text-parchment-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out of Meridian"
              className="p-1.5 rounded-[6px] text-ink-400 hover:text-ink-900 dark:hover:text-parchment-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-[6px] text-ink-400 hover:text-ink-900 dark:hover:text-parchment-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse Toggle Handle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-ink-900 border border-black/[0.12] dark:border-white/[0.15] shadow-sm flex items-center justify-center text-ink-600 dark:text-parchment-300 hover:text-ink-950 dark:hover:text-white transition-colors z-20"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
};

export default Sidebar;
