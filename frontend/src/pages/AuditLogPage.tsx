import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Terminal,
  Eye
} from 'lucide-react';
import { api, AuditLogEntry } from '../api/client';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';

export const AuditLogPage: React.FC = () => {
  const [action, setAction] = useState<string>('');
  const [actorEmail, setActorEmail] = useState<string>('');
  const [page, setPage] = useState(0);

  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['auditLogs', action, actorEmail, page],
    queryFn: () =>
      api.audit.getLogs({
        action: action || undefined,
        actorEmail: actorEmail || undefined,
        page,
        size: 15,
      }),
  });

  const getActionBadgeClass = (act: string) => {
    if (act.includes('SUCCESS') || act.includes('APPROVED')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (act.includes('DENIED') || act.includes('DEACTIVATED') || act.includes('REJECTED')) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (act.includes('ROLE_CHANGED') || act.includes('CREATED')) return 'bg-blue-50 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-300';
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Security & Compliance Audit Logs
          </h2>
          <p className="text-[13px] text-slate-500">
            Immutable audit record of all authentication events, authorization decisions, and employee mutations
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by actor email..."
            value={actorEmail}
            onChange={(e) => {
              setActorEmail(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] rounded border border-slate-300 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1.5 text-[13px] rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_DENIED">LOGIN_DENIED</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            <option value="EMPLOYEE_CREATED">EMPLOYEE_CREATED</option>
            <option value="EMPLOYEE_UPDATED">EMPLOYEE_UPDATED</option>
            <option value="EMPLOYEE_DEACTIVATED">EMPLOYEE_DEACTIVATED</option>
            <option value="LEAVE_REQUESTED">LEAVE_REQUESTED</option>
            <option value="LEAVE_APPROVED">LEAVE_APPROVED</option>
            <option value="LEAVE_REJECTED">LEAVE_REJECTED</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-4">
                    <TableSkeleton rows={8} cols={7} />
                  </td>
                </tr>
              )}

              {!isLoading && logsData?.content.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No audit log entries matching criteria.
                  </td>
                </tr>
              )}

              {!isLoading &&
                logsData?.content.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[12px] text-slate-600 whitespace-nowrap">
                      {log.createdAt.replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-slate-900">
                      {log.actorEmail}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="role" value={log.actorRole || 'UNKNOWN'} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-slate-500">
                      {log.targetResource}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-slate-500">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="View raw details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {logsData && logsData.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-[12px] text-slate-500">
              Page <span className="font-medium text-slate-900">{logsData.number + 1}</span> of{' '}
              <span className="font-medium text-slate-900">{logsData.totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={logsData.first}
                className="px-2.5 py-1 text-[12px] font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={logsData.last}
                className="px-2.5 py-1 text-[12px] font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Entry Inspector"
        description={`Record ID: AUD-${selectedLog?.id}`}
        maxWidth="max-w-2xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-[13px]">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                  Action
                </span>
                <span className="font-mono font-medium text-slate-900">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                  Timestamp
                </span>
                <span className="font-mono text-slate-700">{selectedLog.createdAt}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                  Actor Email
                </span>
                <span className="font-mono text-slate-900">{selectedLog.actorEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                  Client IP
                </span>
                <span className="font-mono text-slate-700">{selectedLog.ipAddress}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold mb-1">
                Event Description / Payload
              </span>
              <div className="p-3 bg-slate-900 text-slate-100 rounded font-mono text-[12px] leading-relaxed break-words whitespace-pre-wrap">
                {selectedLog.details}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold mb-1">
                Client User Agent
              </span>
              <div className="p-2 bg-slate-100 rounded text-slate-600 font-mono text-[11px] break-all">
                {selectedLog.userAgent}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded bg-slate-800 text-white font-medium text-[13px]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

