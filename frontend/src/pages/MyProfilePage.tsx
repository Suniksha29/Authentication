import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import {
  User,
  Mail,
  Building,
  Briefcase,
  Phone,
  Calendar,
  ShieldCheck,
  Server,
  Lock,
  KeyRound
} from 'lucide-react';

export const MyProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded border border-slate-200 shadow-subtle flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.fullName}
            className="w-20 h-20 rounded-full border-2 border-slate-200 shadow-sm object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-700 flex items-center justify-center font-bold text-2xl">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
        )}

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">
              {user.fullName}
            </h2>
            <Badge variant="role" value={user.role} />
            <Badge variant="status" value={user.status} />
          </div>

          <p className="text-[14px] text-slate-600 font-medium">
            {user.jobTitle}
          </p>

          <p className="text-[13px] text-slate-500 font-mono flex items-center justify-center sm:justify-start gap-1.5 pt-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user.email}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Directory Information */}
        <div className="bg-white rounded border border-slate-200 shadow-subtle p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-slate-700" />
            <h3 className="text-[14px] font-semibold text-slate-900">
              Employment Details
            </h3>
          </div>

          <div className="space-y-3 text-[13px]">
            <div>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                Department
              </span>
              <span className="font-medium text-slate-800">
                {user.department?.name} ({user.department?.code})
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                Hire Date
              </span>
              <span className="font-medium text-slate-800 font-mono">
                {user.hireDate}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                Contact Phone
              </span>
              <span className="font-medium text-slate-800 font-mono">
                {user.phone || 'None recorded'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                Database ID
              </span>
              <span className="font-mono text-slate-600 text-[12px]">
                EMP-{String(user.id).padStart(4, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Security Context & Authority */}
        <div className="bg-white rounded border border-slate-200 shadow-subtle p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-[14px] font-semibold text-slate-900">
              Security Context & Authorities
            </h3>
          </div>

          <div className="space-y-3 text-[13px]">
            <div>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold mb-1">
                Spring Security Authorities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.authorities.map((auth) => (
                  <span
                    key={auth}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200"
                  >
                    {auth}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider block font-semibold">
                Active Session Policy
              </span>
              <div className="space-y-1 text-[12px] text-slate-600">
                <div className="flex justify-between">
                  <span>Session Storage:</span>
                  <span className="font-semibold text-slate-800">Redis (Distributed)</span>
                </div>
                <div className="flex justify-between">
                  <span>Cookie Security:</span>
                  <span className="font-mono text-slate-800">HttpOnly, SameSite=Lax</span>
                </div>
                <div className="flex justify-between">
                  <span>Idle Timeout:</span>
                  <span className="font-mono text-slate-800">30 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Absolute Lifetime:</span>
                  <span className="font-mono text-slate-800">8 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

