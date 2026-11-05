export function getCookie(name: string): string | null {
  const matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE';
  department: {
    id: number;
    name: string;
    code: string;
  };
  avatarUrl?: string;
  phone?: string;
  hireDate: string;
  authorities: string[];
}

export interface EmployeeSummary {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE';
  departmentName: string;
  managerName?: string;
  avatarUrl?: string;
}

export interface EmployeeDetail extends EmployeeSummary {
  departmentId: number;
  managerId?: number;
  phone?: string;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  departmentName: string;
  leaveType: 'ANNUAL' | 'SICK' | 'PARENTAL' | 'UNPAID' | 'BEREAVEMENT';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewerId?: number;
  reviewerName?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  pendingLeavesCount: number;
  departmentHeadcount: Record<string, number>;
  recentActivities: AuditLogEntry[];
  pendingApprovals: LeaveRequest[];
}

export interface AuditLogEntry {
  id: number;
  action: string;
  actorEmail: string;
  actorRole: string;
  targetResource: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  createdAt: string;
}

export interface AuthStep {
  stepNumber: number;
  key: string;
  title: string;
  category: string;
  description: string;
  status: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface AuthFlowTrace {
  traceId: string;
  email: string;
  outcome: string;
  summary: string;
  steps: AuthStep[];
  maskedClaims: Record<string, any>;
  sessionMetadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  isDemoTrace: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  // Add CSRF token for state-changing HTTP methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken) {
      headers.set('X-XSRF-TOKEN', xsrfToken);
    }
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Accept', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  return response;
}

export const api = {
  async get<T>(url: string): Promise<T> {
    const res = await fetchWithCsrf(url);
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.message || `Request failed with status ${res.status}`);
      (err as any).status = res.status;
      (err as any).body = errorJson;
      throw err;
    }
    const json: ApiResponse<T> = await res.json();
    return json.data;
  },

  async post<T>(url: string, body?: any): Promise<T> {
    const res = await fetchWithCsrf(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.message || `Request failed with status ${res.status}`);
      (err as any).status = res.status;
      (err as any).body = errorJson;
      throw err;
    }
    const json: ApiResponse<T> = await res.json();
    return json.data;
  },

  async put<T>(url: string, body?: any): Promise<T> {
    const res = await fetchWithCsrf(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const err = new Error(errorJson.message || `Request failed with status ${res.status}`);
      (err as any).status = res.status;
      (err as any).body = errorJson;
      throw err;
    }
    const json: ApiResponse<T> = await res.json();
    return json.data;
  },

  auth: {
    getMe: () => api.get<UserProfile>('/api/auth/me'),
    getStatus: () => api.get<{ authenticated: boolean; email?: string; role?: string; fullName?: string; avatarUrl?: string }>('/api/auth/status'),
    logout: () => api.post<{ success: boolean }>('/api/auth/logout'),
  },

  employees: {
    search: (params: { query?: string; departmentId?: number; role?: string; status?: string; page?: number; size?: number; sort?: string }) => {
      const search = new URLSearchParams();
      if (params.query) search.set('query', params.query);
      if (params.departmentId) search.set('departmentId', String(params.departmentId));
      if (params.role) search.set('role', params.role);
      if (params.status) search.set('status', params.status);
      if (params.page !== undefined) search.set('page', String(params.page));
      if (params.size !== undefined) search.set('size', String(params.size));
      if (params.sort) search.set('sort', params.sort);
      return api.get<PageResponse<EmployeeSummary>>(`/api/employees?${search.toString()}`);
    },
    getById: (id: number) => api.get<EmployeeDetail>(`/api/employees/${id}`),
    create: (data: any) => api.post<EmployeeDetail>('/api/employees', data),
    update: (id: number, data: any) => api.put<EmployeeDetail>(`/api/employees/${id}`, data),
    deactivate: (id: number) => api.post<EmployeeDetail>(`/api/employees/${id}/deactivate`),
    getDepartments: () => api.get<Department[]>('/api/employees/meta/departments'),
    getManagers: () => api.get<EmployeeSummary[]>('/api/employees/meta/managers'),
  },

  leave: {
    getMyLeaves: (status?: string, page = 0, size = 10) => {
      const search = new URLSearchParams({ page: String(page), size: String(size) });
      if (status) search.set('status', status);
      return api.get<PageResponse<LeaveRequest>>(`/api/leave/my?${search.toString()}`);
    },
    getTeamLeaves: (status?: string, page = 0, size = 10) => {
      const search = new URLSearchParams({ page: String(page), size: String(size) });
      if (status) search.set('status', status);
      return api.get<PageResponse<LeaveRequest>>(`/api/leave/team?${search.toString()}`);
    },
    getAllLeaves: (status?: string, page = 0, size = 10) => {
      const search = new URLSearchParams({ page: String(page), size: String(size) });
      if (status) search.set('status', status);
      return api.get<PageResponse<LeaveRequest>>(`/api/leave/all?${search.toString()}`);
    },
    create: (data: { leaveType: string; startDate: string; endDate: string; reason: string }) =>
      api.post<LeaveRequest>('/api/leave', data),
    review: (id: number, data: { status: 'APPROVED' | 'REJECTED'; reviewNotes?: string }) =>
      api.post<LeaveRequest>(`/api/leave/${id}/review`, data),
  },

  dashboard: {
    getSummary: () => api.get<DashboardSummary>('/api/dashboard/summary'),
  },

  audit: {
    getLogs: (params: { action?: string; actorEmail?: string; page?: number; size?: number }) => {
      const search = new URLSearchParams();
      if (params.action) search.set('action', params.action);
      if (params.actorEmail) search.set('actorEmail', params.actorEmail);
      if (params.page !== undefined) search.set('page', String(params.page));
      if (params.size !== undefined) search.set('size', String(params.size));
      return api.get<PageResponse<AuditLogEntry>>(`/api/audit-logs?${search.toString()}`);
    },
  },

  inspector: {
    getLatest: () => api.get<AuthFlowTrace>('/api/auth/inspector/latest'),
    getDemo: () => api.get<AuthFlowTrace>('/api/auth/inspector/demo'),
  },
};

