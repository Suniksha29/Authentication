import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  KeyRound,
  Server,
  Lock,
  Code,
  Terminal,
  Info,
  RefreshCw,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { api, AuthFlowTrace, AuthStep } from '../api/client';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';

export const AuthFlowInspectorPage: React.FC = () => {
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(1);
  const [useDemoTrace, setUseDemoTrace] = useState<boolean>(false);

  const { data: trace, isLoading, refetch } = useQuery<AuthFlowTrace>({
    queryKey: ['authInspectorTrace', useDemoTrace],
    queryFn: () => (useDemoTrace ? api.inspector.getDemo() : api.inspector.getLatest().catch(() => api.inspector.getDemo())),
  });

  const selectedStep: AuthStep | undefined = trace?.steps.find(
    (s) => s.stepNumber === selectedStepNumber
  ) || trace?.steps[0];

  const getStepCategoryColor = (category: string) => {
    switch (category) {
      case 'CLIENT': return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'GOOGLE_OIDC': return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'BACKEND_AUTH': return 'text-purple-800 bg-purple-50 border-purple-200';
      case 'BACKEND_AUTHORIZATION': return 'text-indigo-800 bg-indigo-50 border-indigo-200';
      case 'SESSION': return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded border border-slate-200 shadow-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-brand-50 border border-brand-200 text-brand-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
                  OAuth 2.0 & OIDC Auth Flow Inspector
                </h2>
                {trace?.isDemoTrace && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                    Demo Mode Active
                  </span>
                )}
              </div>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Step-by-step visual timeline of Google authentication and Meridian database role-based authorization
              </p>
            </div>
          </div>
        </div>

        {/* Trace Mode Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-0.5 rounded text-[12px] border border-slate-200 font-medium">
            <button
              onClick={() => { setUseDemoTrace(false); setSelectedStepNumber(1); }}
              className={`px-3 py-1 rounded transition-colors ${
                !useDemoTrace
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Session Trace
            </button>
            <button
              onClick={() => { setUseDemoTrace(true); setSelectedStepNumber(1); }}
              className={`px-3 py-1 rounded transition-colors ${
                useDemoTrace
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Walkthrough
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Refresh Trace"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 rounded border border-slate-200 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : trace ? (
        <>
          {/* Summary Banner */}
          <div className="bg-slate-900 text-white p-5 rounded border border-slate-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                  Target Account:
                </span>
                <span className="font-mono text-[14px] text-brand-300 font-medium">
                  {trace.email}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-medium border uppercase ${
                    trace.outcome === 'SUCCESS'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  {trace.outcome}
                </span>
              </div>
              <p className="text-[13px] text-slate-300">
                {trace.summary}
              </p>
            </div>

            <div className="text-[12px] text-slate-400 font-mono space-y-0.5 shrink-0">
              <div>Trace ID: <span className="text-slate-200">{trace.traceId}</span></div>
              <div>Client IP: <span className="text-slate-200">{trace.ipAddress}</span></div>
            </div>
          </div>

          {/* Interactive 10-Step Timeline Selector */}
          <div className="bg-white rounded border border-slate-200 shadow-subtle p-5">
            <h3 className="text-[14px] font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Authentication & Authorization Pipeline Stages</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {trace.steps.map((step) => {
                const isSelected = step.stepNumber === selectedStepNumber;
                return (
                  <button
                    key={step.stepNumber}
                    onClick={() => setSelectedStepNumber(step.stepNumber)}
                    className={`text-left p-3 rounded border transition-all relative ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-500 font-mono">
                        Step {step.stepNumber}
                      </span>
                      {step.status === 'SUCCESS' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      {step.status === 'FAILED' && (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      {step.status === 'SKIPPED' && (
                        <span className="text-[10px] text-slate-400">SKIPPED</span>
                      )}
                    </div>

                    <div className="text-[12px] font-semibold text-slate-900 truncate">
                      {step.title}
                    </div>

                    <div className="mt-1.5">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-medium ${getStepCategoryColor(
                          step.category
                        )}`}
                      >
                        {step.category.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Step Inspector Box */}
          {selectedStep && (
            <div className="bg-white rounded border border-slate-200 shadow-subtle p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-slate-400 font-mono">
                      Step {selectedStep.stepNumber} of 10
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium ${getStepCategoryColor(
                        selectedStep.category
                      )}`}
                    >
                      {selectedStep.category}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900 mt-1">
                    {selectedStep.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 font-mono text-[12px]">
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-semibold text-[11px] uppercase ${
                      selectedStep.status === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-800'
                        : selectedStep.status === 'FAILED'
                        ? 'bg-rose-50 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedStep.status}
                  </span>
                </div>
              </div>

              <div className="text-[13px] text-slate-700 leading-relaxed bg-slate-50 p-4 rounded border border-slate-200">
                {selectedStep.description}
              </div>

              {/* Technical Execution Parameters */}
              <div>
                <h4 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Execution Metadata & Validated Attributes</span>
                </h4>
                <div className="bg-slate-900 rounded p-4 text-slate-200 font-mono text-[12px] overflow-x-auto shadow-inner">
                  <pre>{JSON.stringify(selectedStep.details, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Masked Claims & Session Metadata Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Decoded OIDC Identity Claims */}
            <div className="bg-white rounded border border-slate-200 shadow-subtle p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-600" />
                  <h3 className="text-[14px] font-semibold text-slate-900">
                    Validated Google ID Token Claims
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                  Sensitive Hashes Masked
                </span>
              </div>

              <p className="text-[12px] text-slate-500">
                Extracted from the cryptographically signed JWT received directly from Google via RS256 token exchange.
              </p>

              <div className="bg-slate-950 text-emerald-400 p-4 rounded font-mono text-[12px] overflow-x-auto shadow-inner max-h-80">
                <pre>{JSON.stringify(trace.maskedClaims, null, 2)}</pre>
              </div>
            </div>

            {/* Distributed Session Context */}
            <div className="bg-white rounded border border-slate-200 shadow-subtle p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-600" />
                  <h3 className="text-[14px] font-semibold text-slate-900">
                    Stateful Session Configuration
                  </h3>
                </div>
                <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-medium">
                  Spring Session + Redis
                </span>
              </div>

              <p className="text-[12px] text-slate-500">
                Enterprise sessions are distributed across Redis nodes with strict cookie isolation. Tokens are never exposed to browser localStorage.
              </p>

              <div className="bg-slate-950 text-sky-400 p-4 rounded font-mono text-[12px] overflow-x-auto shadow-inner max-h-80">
                <pre>{JSON.stringify(trace.sessionMetadata, null, 2)}</pre>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

