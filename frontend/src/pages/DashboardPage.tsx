import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  CalendarClock,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Building2,
  CalendarDays,
  FileText,
  User,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { api, DashboardSummary } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: summary, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: () => api.dashboard.getSummary(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) =>
      api.leave.review(id, { status }),
    onSuccess: (_, vars) => {
      showToast(`Leave request ${vars.status.toLowerCase()} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to review leave request.', 'error');
    },
  });

  const upcomingHolidays = [
    { name: 'Thanksgiving Holiday', date: 'Nov 26 – Nov 27', duration: '2 days off' },
    { name: 'Winter Office Recess', date: 'Dec 24 – Dec 26', duration: '3 days off' },
    { name: "New Year's Day", date: 'Jan 01', duration: '1 day off' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-[6px] border border-black/[0.08] dark:border-white/[0.1]">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-[6px] border border-black/[0.08] dark:border-white/[0.1]">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="bg-white p-6 rounded-[6px] border border-black/[0.08] dark:border-white/[0.1]">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 rounded-[6px] bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
        Failed to load dashboard metrics. Please refresh or check backend connection.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-ink-900 p-6 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[18px] font-bold text-ink-950 dark:text-parchment-50 tracking-tight">
              Welcome back, {user?.firstName} {user?.lastName}
            </h2>
            <Badge variant="role" value={user?.role || 'EMPLOYEE'} />
          </div>
          <p className="text-[13px] text-ink-500 dark:text-parchment-400 mt-1 flex items-center gap-2">
            <span>{user?.jobTitle}</span>
            <span>&bull;</span>
            <span>{user?.department?.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/leave"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-ink-900 hover:bg-ink-800 dark:bg-parchment-100 dark:hover:bg-white text-parchment-50 dark:text-ink-950 text-[13px] font-medium shadow-sm transition-colors"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Request Leave</span>
          </Link>

          {(isAdmin || isHR) && (
            <Link
              to="/employees"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-white hover:bg-parchment-50 dark:bg-ink-850 border border-slate-300 text-ink-700 dark:text-parchment-300 text-[13px] font-medium shadow-subtle transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-ink-500 dark:text-parchment-400" />
              <span>Manage Employees</span>
            </Link>
          )}

          <Link
            to="/directory"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-parchment-50 dark:bg-ink-850 hover:bg-parchment-100 dark:bg-ink-800 border border-black/[0.08] dark:border-white/[0.1] text-ink-700 dark:text-parchment-300 text-[13px] font-medium transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-ink-500 dark:text-parchment-400" />
            <span>Directory</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-ink-900 p-5 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card">
          <div className="flex items-center justify-between text-ink-500 dark:text-parchment-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-parchment-400">
              Total Headcount
            </span>
            <Users className="w-4 h-4 text-ink-400 dark:text-parchment-500" />
          </div>
          <div className="text-[26px] font-bold text-ink-950 dark:text-parchment-50 tabular-nums">
            {summary.totalEmployees}
          </div>
          <div className="text-[12px] text-ink-500 dark:text-parchment-400 mt-1">
            Registered personnel in directory
          </div>
        </div>

        <div className="bg-white dark:bg-ink-900 p-5 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card">
          <div className="flex items-center justify-between text-ink-500 dark:text-parchment-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-parchment-400">
              Active Employees
            </span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-[26px] font-bold text-ink-950 dark:text-parchment-50 tabular-nums">
            {summary.activeEmployees}
          </div>
          <div className="text-[12px] text-emerald-700 font-medium mt-1">
            Currently active in organization
          </div>
        </div>

        <div className="bg-white dark:bg-ink-900 p-5 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card">
          <div className="flex items-center justify-between text-ink-500 dark:text-parchment-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-parchment-400">
              Inactive Accounts
            </span>
            <UserX className="w-4 h-4 text-ink-400 dark:text-parchment-500" />
          </div>
          <div className="text-[26px] font-bold text-ink-950 dark:text-parchment-50 tabular-nums">
            {summary.inactiveEmployees}
          </div>
          <div className="text-[12px] text-ink-500 dark:text-parchment-400 mt-1">
            Archived or former personnel
          </div>
        </div>

        <div className="bg-white dark:bg-ink-900 p-5 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card">
          <div className="flex items-center justify-between text-ink-500 dark:text-parchment-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-parchment-400">
              Pending Leave
            </span>
            <CalendarClock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-[26px] font-bold text-ink-950 dark:text-parchment-50 tabular-nums">
            {summary.pendingLeavesCount}
          </div>
          <div className="text-[12px] text-amber-700 font-medium mt-1">
            Awaiting manager review
          </div>
        </div>
      </div>

      {/* Main Grid: Approvals & Departments (Left) + Quick Actions & Calendar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Pending Approvals & Department Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approvals (For Manager/HR/Admin) */}
          {summary.pendingApprovals && summary.pendingApprovals.length > 0 ? (
            <div className="bg-white dark:bg-ink-900 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-black/[0.08] dark:border-white/[0.1] flex items-center justify-between bg-parchment-100/60 dark:bg-ink-850/60">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-[14px] font-semibold text-ink-950 dark:text-parchment-50">
                    Pending Leave Approvals
                  </h3>
                </div>
                <Link
                  to="/leave"
                  className="text-[12px] text-copper-700 dark:text-copper-400 font-medium flex items-center gap-1 hover:underline"
                >
                  <span>View All Requests</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {summary.pendingApprovals.map((req) => (
                  <div key={req.id} className="p-4 flex items-center justify-between gap-4 hover:bg-parchment-100/60 dark:bg-ink-850/60 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-ink-950 dark:text-parchment-50">
                          {req.employeeName}
                        </span>
                        <span className="text-[11px] text-ink-500 dark:text-parchment-400 font-normal">
                          ({req.departmentName})
                        </span>
                        <Badge variant="leave" value={req.leaveType} />
                      </div>
                      <p className="text-[12px] text-ink-500 dark:text-parchment-400 mt-1 line-clamp-1">
                        {req.startDate} to {req.endDate} &bull; {req.daysCount} day(s) &bull; &ldquo;{req.reason}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => reviewMutation.mutate({ id: req.id, status: 'APPROVED' })}
                        disabled={reviewMutation.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[12px] font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => reviewMutation.mutate({ id: req.id, status: 'REJECTED' })}
                        disabled={reviewMutation.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-parchment-100 dark:bg-ink-800 hover:bg-slate-200 text-ink-700 dark:text-parchment-300 border border-slate-300 text-[12px] font-medium transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-ink-900 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-ink-950 dark:text-parchment-50">
                    No Pending Leave Requests
                  </h4>
                  <p className="text-[12px] text-ink-500 dark:text-parchment-400 mt-0.5">
                    All submitted employee time-off requests have been reviewed and processed.
                  </p>
                </div>
              </div>
              <Link
                to="/leave"
                className="text-[12px] text-copper-700 dark:text-copper-400 font-medium hover:underline"
              >
                Go to Leave Hub &rarr;
              </Link>
            </div>
          )}

          {/* Department Headcount Breakdown */}
          <div className="bg-white dark:bg-ink-900 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-ink-600 dark:text-parchment-400" />
                <h3 className="text-[14px] font-semibold text-ink-950 dark:text-parchment-50">
                  Headcount by Department
                </h3>
              </div>
              <Link
                to="/directory"
                className="text-[12px] text-copper-700 dark:text-copper-400 font-medium hover:underline"
              >
                View Directory &rarr;
              </Link>
            </div>

            <div className="space-y-3.5">
              {Object.entries(summary.departmentHeadcount).map(([dept, count]) => {
                const percentage = Math.round((count / (summary.activeEmployees || 1)) * 100);
                return (
                  <div key={dept} className="space-y-1.5">
                    <div className="flex justify-between text-[12px]">
                      <span className="font-medium text-ink-700 dark:text-parchment-300">{dept}</span>
                      <span className="text-ink-500 dark:text-parchment-400 tabular-nums font-mono">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-parchment-100 dark:bg-ink-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-copper-600 dark:bg-copper-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Quick Actions & Company Calendar */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-ink-900 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card p-5">
            <h3 className="text-[14px] font-semibold text-ink-950 dark:text-parchment-50 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-ink-600 dark:text-parchment-400" />
              <span>Workspace Quick Links</span>
            </h3>

            <div className="space-y-2">
              <Link
                to="/leave"
                className="flex items-center justify-between p-2.5 rounded-[6px] border border-black/[0.04] dark:border-white/[0.06] hover:bg-parchment-50 dark:bg-ink-850 text-[13px] font-medium text-ink-700 dark:text-parchment-300 hover:text-ink-950 dark:text-parchment-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="w-4 h-4 text-copper-700 dark:text-copper-400" />
                  <span>Submit Time Off Request</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-ink-400 dark:text-parchment-500" />
              </Link>

              <Link
                to="/directory"
                className="flex items-center justify-between p-2.5 rounded-[6px] border border-black/[0.04] dark:border-white/[0.06] hover:bg-parchment-50 dark:bg-ink-850 text-[13px] font-medium text-ink-700 dark:text-parchment-300 hover:text-ink-950 dark:text-parchment-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-ink-600 dark:text-parchment-400" />
                  <span>Browse Staff Directory</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-ink-400 dark:text-parchment-500" />
              </Link>

              {(isAdmin || isHR) && (
                <Link
                  to="/employees"
                  className="flex items-center justify-between p-2.5 rounded-[6px] border border-black/[0.04] dark:border-white/[0.06] hover:bg-parchment-50 dark:bg-ink-850 text-[13px] font-medium text-ink-700 dark:text-parchment-300 hover:text-ink-950 dark:text-parchment-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>Authorize New Employee</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-400 dark:text-parchment-500" />
                </Link>
              )}

              <Link
                to="/profile"
                className="flex items-center justify-between p-2.5 rounded-[6px] border border-black/[0.04] dark:border-white/[0.06] hover:bg-parchment-50 dark:bg-ink-850 text-[13px] font-medium text-ink-700 dark:text-parchment-300 hover:text-ink-950 dark:text-parchment-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-ink-600 dark:text-parchment-400" />
                  <span>View My Profile</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-ink-400 dark:text-parchment-500" />
              </Link>
            </div>
          </div>

          {/* Upcoming Holidays Card */}
          <div className="bg-white dark:bg-ink-900 rounded-[8px] border border-black/[0.08] dark:border-white/[0.1] shadow-card p-5">
            <h3 className="text-[14px] font-semibold text-ink-950 dark:text-parchment-50 mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-ink-600 dark:text-parchment-400" />
              <span>Upcoming Observances</span>
            </h3>

            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {upcomingHolidays.map((holiday, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-[12px]">
                  <div>
                    <div className="font-semibold text-slate-800">{holiday.name}</div>
                    <div className="text-ink-500 dark:text-parchment-400 text-[11px]">{holiday.date}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-parchment-100 dark:bg-ink-800 text-ink-600 dark:text-parchment-400 font-medium text-[11px]">
                    {holiday.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Workspace Governance Summary */}
          <div className="bg-parchment-50 dark:bg-ink-850/80 rounded-[6px] border border-black/[0.08] dark:border-white/[0.1] p-4 text-[12px] space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Enterprise Identity &amp; RBAC</span>
            </div>
            <p className="text-ink-600 dark:text-parchment-400 text-[11px] leading-relaxed">
              Active sessions are secured with HttpOnly cookies and role-based method security. Adding or deactivating directory profiles immediately takes effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
