import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, RefreshCw, Activity, Mail } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'Unknown Google Account';
  const errorType = searchParams.get('error') || 'unauthorized';
  const message = searchParams.get('message') || 'You are not authorized to access Meridian.';

  const getExplanation = () => {
    switch (errorType) {
      case 'not_found':
        return {
          title: 'Employee Record Not Found',
          badge: 'Unregistered Identity',
          detail: 'Your Google identity was cryptographically verified, but this email address is not registered in the Meridian employee database. An HR administrator must first add you to the employee directory to grant system access.',
        };
      case 'inactive':
        return {
          title: 'Account Inactive or Deactivated',
          badge: 'Deactivated Status',
          detail: 'Your Google account was recognized, but your Meridian employee record has been marked as INACTIVE. Access has been suspended by HR or system administration.',
        };
      case 'unverified':
        return {
          title: 'Google Email Unverified',
          badge: 'Unverified Email Claim',
          detail: 'The Google OpenID Connect token indicated that email_verified is false. Meridian policy requires verified email addresses to prevent account spoofing.',
        };
      case 'invalid_domain':
        return {
          title: 'Hosted Domain Not Permitted',
          badge: 'Domain Policy Violation',
          detail: 'The Google account domain does not match the corporate allowed domain policy configured for Meridian.',
        };
      default:
        return {
          title: 'Access Restricted',
          badge: 'Access Denied',
          detail: message,
        };
    }
  };

  const exp = getExplanation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-[520px] bg-white rounded-md border border-slate-200 shadow-card p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-slate-900">
                {exp.title}
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                {exp.badge}
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Authentication succeeded, but authorization was denied.
            </p>
          </div>
        </div>

        {/* Identity Details Card */}
        <div className="bg-slate-50 rounded border border-slate-200 p-4 mb-6 space-y-3">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Attempted Identity
          </div>
          <div className="flex items-center gap-2 text-slate-900 font-mono text-[13px] bg-white px-3 py-2 rounded border border-slate-200">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
          <p className="text-[12px] text-slate-600 leading-relaxed">
            {exp.detail}
          </p>
        </div>

        {/* Security Concept Note */}
        <div className="rounded border border-blue-100 bg-blue-50/60 p-3 mb-6 text-[12px] text-blue-900">
          <div className="font-semibold text-[12px] mb-1">
            Enterprise Security Architecture Note
          </div>
          <p className="text-[11px] text-blue-800/90 leading-relaxed">
            Meridian strictly enforces the principle that <strong>having a Google account is not equivalent to being authorized</strong>. An internal HR database check independently verifies employee employment status and role mapping on every authentication exchange.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href="/oauth2/authorization/google"
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-[13px] font-medium shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sign in with a different Google account</span>
          </a>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-slate-900 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>

            <Link
              to="/auth-inspector"
              className="inline-flex items-center gap-1.5 text-[12px] text-brand-600 hover:text-brand-700 font-medium hover:underline"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>View Auth Flow Inspector</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

