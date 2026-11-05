import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Edit2,
  UserX,
  Search,
  ShieldAlert,
  Info,
  CheckCircle2,
  Building,
  KeyRound,
  AlertTriangle
} from 'lucide-react';
import { api, EmployeeSummary, Department } from '../api/client';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export const EmployeeManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);

  // Form states for Add
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    role: 'EMPLOYEE',
    departmentId: 2, // Default Engineering
    managerId: null as number | null,
    phone: '',
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.employees.getDepartments(),
  });

  const { data: managers } = useQuery<EmployeeSummary[]>({
    queryKey: ['managersList'],
    queryFn: () => api.employees.getManagers(),
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employeesManagement', searchQuery, page],
    queryFn: () =>
      api.employees.search({
        query: searchQuery || undefined,
        page,
        size: 10,
        sort: 'id,desc',
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.employees.create(data),
    onSuccess: (created) => {
      showToast(`Employee ${created.fullName} (${created.email}) authorized to log in!`);
      queryClient.invalidateQueries({ queryKey: ['employeesManagement'] });
      queryClient.invalidateQueries({ queryKey: ['employeesDirectory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsAddOpen(false);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        jobTitle: '',
        role: 'EMPLOYEE',
        departmentId: 2,
        managerId: null,
        phone: '',
      });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create employee.', 'error');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => api.employees.deactivate(id),
    onSuccess: (deactivated) => {
      showToast(`Account for ${deactivated.email} deactivated. Google login now BLOCKED.`, 'info');
      queryClient.invalidateQueries({ queryKey: ['employeesManagement'] });
      queryClient.invalidateQueries({ queryKey: ['employeesDirectory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setDeactivateId(null);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to deactivate employee.', 'error');
    },
  });

  return (
    <div className="space-y-4">
      {/* Header and Authorization banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Employee Access & Identity Management
          </h2>
          <p className="text-[13px] text-slate-500">
            Control which Google accounts are authorized to sign in to Meridian
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-ink-900 hover:bg-ink-800 dark:bg-parchment-100 dark:hover:bg-white text-parchment-50 dark:text-ink-950 font-medium text-[13px] font-medium shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Authorize New Employee</span>
        </button>
      </div>

      {/* Enterprise Security Policy Callout */}
      <div className="p-4 rounded border border-blue-200 bg-blue-50/50 flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-copper-700 dark:text-copper-400 shrink-0 mt-0.5" />
        <div className="text-[12px] text-slate-700">
          <span className="font-semibold text-slate-900">Immediate Access Control: </span>
          Adding an employee email here immediately permits that Google account to pass OIDC authorization and log in. Conversely, clicking <strong>Deactivate</strong> immediately revokes all login privileges, causing subsequent Google login attempts to be redirected to <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">/access-denied</code>.
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-subtle flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter employees by email or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] rounded border border-slate-300 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Management Table */}
      <div className="bg-white rounded border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Authorized Identity</th>
                <th className="py-3 px-4">Title & Department</th>
                <th className="py-3 px-4">Security Role</th>
                <th className="py-3 px-4">Login Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-4">
                    <TableSkeleton rows={6} cols={5} />
                  </td>
                </tr>
              )}

              {!isLoading &&
                employees?.content.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {emp.fullName}
                      </div>
                      <div className="text-[12px] text-slate-500 font-mono">
                        {emp.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{emp.jobTitle}</div>
                      <div className="text-[11px] text-slate-500">{emp.departmentName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="role" value={emp.role} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="status" value={emp.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {emp.status === 'ACTIVE' ? (
                          <button
                            onClick={() => setDeactivateId(emp.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[12px] font-medium transition-colors"
                            title="Block Google login for this account"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Deactivated
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Authorize New Employee (Google OIDC Access)"
        description="Adding this email authorizes the corresponding Google account to sign in with assigned role permissions."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4 text-[13px]"
        >
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Google Account Email <span className="text-rose-600">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. employee@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-1.5 rounded border border-slate-300 font-mono text-[13px] focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              This exact email must match the Google OIDC verified account email.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                First Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Last Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Job Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Cloud Architect"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                System Role <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-brand-500"
              >
                <option value="EMPLOYEE">EMPLOYEE (Default)</option>
                <option value="MANAGER">MANAGER (Team Approvals)</option>
                <option value="HR">HR (Directory & Leaves)</option>
                <option value="ADMIN">ADMIN (Full Control & Audit)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Department <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-brand-500"
              >
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Reports To (Manager)
            </label>
            <select
              value={formData.managerId || ''}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-brand-500"
            >
              <option value="">None (Top-Level Executive)</option>
              {managers?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.role} - {m.jobTitle})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              placeholder="+1-555-0199"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-[13px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-1.5 rounded bg-ink-900 hover:bg-ink-800 dark:bg-parchment-100 dark:hover:bg-white text-parchment-50 dark:text-ink-950 font-medium font-medium text-[13px] shadow-sm disabled:opacity-50"
            >
              {createMutation.isPending ? 'Authorizing...' : 'Authorize Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={deactivateId !== null}
        onClose={() => setDeactivateId(null)}
        title="Confirm Immediate Account Deactivation"
        description="This action immediately blocks Google OIDC sign-in for this user."
      >
        <div className="space-y-4 text-[13px]">
          <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Security Enforcement Notice:</strong>
              <p className="mt-0.5 text-[12px] text-amber-800 leading-relaxed">
                When this employee attempts to authenticate via Google, our backend OidcUserService will detect the <code className="font-mono">INACTIVE</code> status and throw an <code className="font-mono">InactiveEmployeeException</code>, redirecting them directly to the Access Denied page.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeactivateId(null)}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deactivateId && deactivateMutation.mutate(deactivateId)}
              disabled={deactivateMutation.isPending}
              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm disabled:opacity-50"
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Confirm Deactivation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

