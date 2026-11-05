import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Building,
  Filter
} from 'lucide-react';
import { api, LeaveRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export const LeaveManagementPage: React.FC = () => {
  const { user, isManager, isHR, isAdmin } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'MY' | 'TEAM' | 'ALL'>('MY');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  // New leave request modal
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Review modal
  const [reviewItem, setReviewItem] = useState<{ id: number; employeeName: string; status: 'APPROVED' | 'REJECTED' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Queries based on active tab
  const { data: leavesData, isLoading } = useQuery({
    queryKey: ['leaves', activeTab, statusFilter, page],
    queryFn: () => {
      if (activeTab === 'TEAM') {
        return api.leave.getTeamLeaves(statusFilter || undefined, page, 10);
      } else if (activeTab === 'ALL') {
        return api.leave.getAllLeaves(statusFilter || undefined, page, 10);
      }
      return api.leave.getMyLeaves(statusFilter || undefined, page, 10);
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.leave.create({
        leaveType,
        startDate,
        endDate,
        reason,
      }),
    onSuccess: () => {
      showToast('Leave request submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsRequestOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to submit leave request.', 'error');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!reviewItem) throw new Error('No review item selected');
      return api.leave.review(reviewItem.id, {
        status: reviewItem.status,
        reviewNotes: reviewNotes || undefined,
      });
    },
    onSuccess: (_, vars) => {
      showToast(`Leave request marked as ${reviewItem?.status.toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setReviewItem(null);
      setReviewNotes('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to review leave request.', 'error');
    },
  });

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Leave & Time-Off Management
          </h2>
          <p className="text-[13px] text-slate-500">
            Submit leave requests and process manager workflow approvals
          </p>
        </div>

        <button
          onClick={() => setIsRequestOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-ink-900 hover:bg-ink-800 dark:bg-parchment-100 dark:hover:bg-white text-parchment-50 dark:text-ink-950 font-medium text-[13px] font-medium shadow-sm transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>New Leave Request</span>
        </button>
      </div>

      {/* Role-Aware Tabs & Filter Bar */}
      <div className="bg-white rounded border border-slate-200 shadow-subtle p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[13px]">
          <button
            onClick={() => { setActiveTab('MY'); setPage(0); }}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'MY'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Requests
          </button>

          {isManager && (
            <button
              onClick={() => { setActiveTab('TEAM'); setPage(0); }}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeTab === 'TEAM'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Team Approvals
            </button>
          )}

          {(isHR || isAdmin) && (
            <button
              onClick={() => { setActiveTab('ALL'); setPage(0); }}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Company Requests
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-2.5 py-1 text-[13px] rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Leaves Data Table */}
      <div className="bg-white rounded border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration & Dates</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status & Reviewer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-4">
                    <TableSkeleton rows={5} cols={6} />
                  </td>
                </tr>
              )}

              {!isLoading && leavesData?.content.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No leave requests found for the selected view.
                  </td>
                </tr>
              )}

              {!isLoading &&
                leavesData?.content.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{leave.employeeName}</div>
                      <div className="text-[11px] text-slate-500">{leave.departmentName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="leave" value={leave.leaveType} />
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium tabular-nums">{leave.startDate} to {leave.endDate}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums">{leave.daysCount} business day(s)</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="status" value={leave.status} />
                      {leave.reviewerName && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          by {leave.reviewerName}
                        </div>
                      )}
                      {leave.reviewNotes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1" title={leave.reviewNotes}>
                          &ldquo;{leave.reviewNotes}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {leave.status === 'PENDING' && (activeTab === 'TEAM' || activeTab === 'ALL' || isHR || isAdmin) ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setReviewItem({ id: leave.id, employeeName: leave.employeeName, status: 'APPROVED' })}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                            title="Approve request"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReviewItem({ id: leave.id, employeeName: leave.employeeName, status: 'REJECTED' })}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="Reject request"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      <Modal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        title="Submit Time-Off Request"
        description="Submit your planned leave for manager approval."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4 text-[13px]"
        >
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Leave Category <span className="text-rose-600">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-brand-500"
            >
              <option value="ANNUAL">Annual Vacation Leave</option>
              <option value="SICK">Medical / Sick Leave</option>
              <option value="PARENTAL">Parental Leave</option>
              <option value="BEREAVEMENT">Bereavement Leave</option>
              <option value="UNPAID">Unpaid Personal Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Start Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                End Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {calculateDays() > 0 && (
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[12px] text-slate-600 font-medium">
              Requested duration: <span className="text-copper-700 dark:text-copper-400 font-bold">{calculateDays()} calendar day(s)</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Reason / Coverage Plan <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide context or designate teammate for duty coverage..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRequestOpen(false)}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || calculateDays() <= 0}
              className="px-4 py-1.5 rounded bg-ink-900 hover:bg-ink-800 dark:bg-parchment-100 dark:hover:bg-white text-parchment-50 dark:text-ink-950 font-medium font-medium shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewItem !== null}
        onClose={() => setReviewItem(null)}
        title={`Confirm ${reviewItem?.status === 'APPROVED' ? 'Approval' : 'Rejection'}`}
        description={`Reviewing leave request for ${reviewItem?.employeeName}.`}
      >
        <div className="space-y-4 text-[13px]">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Reviewer Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Approved. Coverage confirmed."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReviewItem(null)}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
              className={`px-4 py-1.5 rounded text-white font-medium shadow-sm disabled:opacity-50 ${
                reviewItem?.status === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {reviewMutation.isPending ? 'Processing...' : `Confirm ${reviewItem?.status}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

