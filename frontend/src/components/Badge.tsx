import React from 'react';

interface BadgeProps {
  variant?: 'role' | 'status' | 'leave';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'status', value, className = '' }) => {
  const normalized = (value || '').toUpperCase();

  let styles = 'bg-parchment-100 text-slate-600 dark:bg-ink-850 dark:text-parchment-400 border-black/[0.08] dark:border-white/[0.1]';

  if (normalized === 'ACTIVE' || normalized === 'APPROVED' || normalized === 'SUCCESS') {
    styles = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  } else if (normalized === 'INACTIVE' || normalized === 'REJECTED' || normalized === 'FAILED' || normalized === 'CANCELLED') {
    styles = 'bg-parchment-100 text-slate-600 dark:bg-ink-850 dark:text-parchment-400 border-black/[0.08] dark:border-white/[0.1]';
  } else if (normalized === 'PENDING' || normalized === 'IN_PROGRESS') {
    styles = 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  } else if (normalized === 'ADMIN') {
    styles = 'bg-slate-900 text-white dark:bg-parchment-100 dark:text-ink-950 border-slate-900 font-semibold';
  } else if (normalized === 'HR') {
    styles = 'bg-copper-50 text-copper-800 dark:bg-copper-950/60 dark:text-copper-300 border-copper-200 dark:border-copper-800';
  } else if (normalized === 'MANAGER') {
    styles = 'bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-parchment-200 border-black/[0.1] dark:border-white/[0.12]';
  } else if (normalized === 'EMPLOYEE') {
    styles = 'bg-parchment-100 text-slate-600 dark:bg-ink-850 dark:text-parchment-400 border-black/[0.08] dark:border-white/[0.1]';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] font-mono text-[10px] border tracking-wider uppercase ${styles} ${className}`}
    >
      {value}
    </span>
  );
};

export default Badge;
