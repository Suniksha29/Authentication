import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Mail, Building, Briefcase } from 'lucide-react';
import { api, EmployeeSummary, Department } from '../api/client';
import { Badge } from '../components/Badge';
import { TableSkeleton } from '../components/Skeleton';

export const EmployeeDirectoryPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState('lastName');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => api.employees.getDepartments(),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['employeesDirectory', query, departmentId, role, status, page, sortField, sortDir],
    queryFn: () =>
      api.employees.search({
        query: query || undefined,
        departmentId,
        role: role || undefined,
        status: status || undefined,
        page,
        size: 10,
        sort: `${sortField},${sortDir.toLowerCase()}`,
      }),
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDir('ASC');
    }
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Employee Directory
          </h2>
          <p className="text-[13px] text-slate-500">
            Browse all corporate staff and organizational structure
          </p>
        </div>
        {data && (
          <div className="text-[12px] text-slate-500 font-mono tabular-nums">
            Total records: <span className="font-semibold text-slate-800">{data.totalElements}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or job title..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] rounded border border-slate-300 focus:outline-none focus:border-ink-900 dark:focus:border-copper-500 focus:ring-1 focus:ring-ink-900 dark:focus:ring-copper-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={departmentId || ''}
            onChange={(e) => {
              setDepartmentId(e.target.value ? Number(e.target.value) : undefined);
              setPage(0);
            }}
            className="px-2.5 py-1.5 text-[13px] rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Departments</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1.5 text-[13px] rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HR">HR</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1.5 text-[13px] rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th
                  onClick={() => handleSort('lastName')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Employee</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('jobTitle')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Role & Title</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Reports To</th>
                <th className="py-3 px-4">Access Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-4">
                    <TableSkeleton rows={8} cols={5} />
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-rose-600">
                    Failed to load directory. Please refresh.
                  </td>
                </tr>
              )}

              {!isLoading && data?.content.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    No employees matching the current search criteria.
                  </td>
                </tr>
              )}

              {!isLoading &&
                data?.content.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-semibold text-[11px] shrink-0">
                            {emp.firstName[0]}
                            {emp.lastName[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{emp.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{emp.jobTitle}</div>
                      <div className="mt-0.5">
                        <Badge variant="role" value={emp.role} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{emp.departmentName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.managerName ? (
                        <span>{emp.managerName}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[12px]">None (Executive)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="status" value={emp.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-[12px] text-slate-500">
              Page <span className="font-medium text-slate-900">{data.number + 1}</span> of{' '}
              <span className="font-medium text-slate-900">{data.totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={data.first}
                className="px-2.5 py-1 text-[12px] font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={data.last}
                className="px-2.5 py-1 text-[12px] font-medium rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

