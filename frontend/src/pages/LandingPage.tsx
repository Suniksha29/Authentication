import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  ChevronDown,
  Sun,
  Moon,
  Users,
  Calendar,
  Lock,
  Server,
  Building,
  Key,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// CUSTOM GEOMETRIC MONOGRAM
// Two interlocking precision astronomical arcs with a central meridian axis.
// ============================================================================
export const MeridianMonogram: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 28,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <circle
      cx="16"
      cy="16"
      r="14"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeDasharray="2 2"
      className="opacity-25"
    />
    <path
      d="M16 3C8.82 3 3 8.82 3 16C3 23.18 8.82 29 16 29"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className="opacity-90"
    />
    <ellipse
      cx="16"
      cy="16"
      rx="7.5"
      ry="13"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-copper-600 dark:text-copper-500"
    />
    <line
      x1="16"
      y1="2"
      x2="16"
      y2="30"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="16" cy="16" r="2.25" fill="currentColor" />
  </svg>
);

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Dark / Light Mode State
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('meridian-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('meridian-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('meridian-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Bento Interactive Card State (Leave Simulator)
  const [leaveStatus, setLeaveStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Why separate Google OIDC identity from database authorization?',
      a: 'Federated identity verifies who the user is, but never grants permissions by default. Meridian separates authentication (handled by Google OpenID Connect via Authorization Code Flow with PKCE) from authorization (enforced by our internal PostgreSQL employee registry). A valid Google account cannot access the portal unless an active, authorized employee record exists in the database.',
    },
    {
      q: 'How does Meridian safeguard employee sessions without browser tokens?',
      a: 'Tokens stored in localStorage or sessionStorage are vulnerable to cross-site scripting (XSS). Meridian strictly issues HttpOnly, SameSite=Lax, Secure session cookies stored server-side in Redis. Sessions enforce a 30-minute idle timeout, an 8-hour absolute ceiling, and automatic session fixation protection.',
    },
    {
      q: 'What role tiers are enforced at the API layer?',
      a: 'We enforce four discrete tiers: Administrator (system configuration, role assignment, audit logs), Human Resources (employee onboarding, directory management, leave approvals), Department Manager (team visibility, direct leave approvals), and Employee (personal profile, directory access, time-off requests). Every endpoint is guarded with Spring @PreAuthorize method-level security.',
    },
    {
      q: 'How does workspace isolation function in multi-tenant environments?',
      a: 'Meridian applies cryptographic workspace partitioning at the ingress gateway. Domain bindings are mapped to isolated realm identifiers, separating Redis session partitions and enforcing parameterized row-level filters across all database queries.',
    },
  ];

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-ink-950 text-ink-900 dark:text-parchment-100 font-sans selection:bg-copper-100 dark:selection:bg-copper-900/40 selection:text-copper-800 transition-colors duration-200">
      {/* Background Architectural Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none noise-overlay z-0"
        aria-hidden="true"
      />

      {/* =====================================================================
          1. HEADER
      ====================================================================== */}
      <header className="sticky top-0 z-50 bg-parchment-50/85 dark:bg-ink-950/85 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <MeridianMonogram className="text-ink-900 dark:text-parchment-50 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] tracking-[-0.02em] text-ink-900 dark:text-parchment-50 leading-tight">
                Meridian
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-500 dark:text-parchment-400">
                Workforce OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 font-mono text-[12px] uppercase tracking-wider text-ink-600 dark:text-parchment-300">
            <a href="#capabilities" className="hover:text-ink-950 dark:hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#governance" className="hover:text-ink-950 dark:hover:text-white transition-colors">
              Governance
            </a>
            <a href="#lifecycle" className="hover:text-ink-950 dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#faq" className="hover:text-ink-950 dark:hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-[6px] text-ink-600 dark:text-parchment-300 hover:text-ink-950 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors focus:outline-none"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[6px] bg-ink-900 hover:bg-ink-800 dark:bg-parchment-100 dark:hover:bg-white text-parchment-50 dark:text-ink-950 text-[13px] font-medium transition-all shadow-sm group"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center h-9 px-3.5 rounded-[6px] text-ink-700 dark:text-parchment-200 hover:text-ink-950 dark:hover:text-white text-[13px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[6px] bg-ink-900 hover:bg-ink-800 dark:bg-parchment-100 dark:hover:bg-white text-parchment-50 dark:text-ink-950 text-[13px] font-medium transition-all shadow-sm group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. HERO SECTION (CLEAN, FOCUSED, NO CLUTTERED RIGHT CARDS)
      ====================================================================== */}
      <section className="relative z-10 pt-20 pb-24 md:pt-28 md:pb-32 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          
          {/* Category Eyebrow */}
          <div className="inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-copper-700 dark:text-copper-400">
            <span className="w-1.5 h-1.5 rounded-full bg-copper-600 animate-pulse-subtle" />
            <span>Enterprise Workforce Platform</span>
          </div>

          {/* Simple, Authoritative Headline */}
          <h1 className="text-[38px] sm:text-[52px] md:text-[62px] font-medium text-ink-950 dark:text-parchment-50 leading-[1.08] tracking-[-0.035em]">
            Manage your workforce.{' '}
            <span className="font-serif italic font-normal text-copper-700 dark:text-copper-500">
              Simplify
            </span>{' '}
            your work.
          </h1>

          {/* Crisp, Concise Subtitle */}
          <p className="text-[16px] sm:text-[18px] text-ink-600 dark:text-parchment-300 max-w-2xl mx-auto leading-relaxed font-normal">
            One centralized platform to manage employee records, organize company departments, and streamline leave approvals with enterprise-grade access control.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-7 rounded-[6px] bg-ink-900 hover:bg-ink-800 dark:bg-parchment-100 dark:hover:bg-white text-parchment-50 dark:text-ink-950 font-medium text-[14px] shadow-sm transition-all group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-6 rounded-[6px] border border-black/[0.12] dark:border-white/[0.14] text-ink-800 dark:text-parchment-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[14px] font-medium transition-colors"
            >
              Sign In to Portal
            </Link>
          </div>

          {/* Understated Mono Trust Strip */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] text-ink-500 dark:text-parchment-400 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>99.99% Availability</span>
            </div>
            <span>&bull;</span>
            <div>OIDC + PKCE Authentication</div>
            <span>&bull;</span>
            <div>Role-Based Access Control</div>
            <span>&bull;</span>
            <div>Secure Redis Sessions</div>
          </div>

        </div>
      </section>

      {/* =====================================================================
          3. LOGOS / SOCIAL PROOF STRIP
      ====================================================================== */}
      <section className="py-10 border-b border-black/[0.06] dark:border-white/[0.08] bg-parchment-100/60 dark:bg-ink-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500 dark:text-parchment-400 mb-5">
            BUILT FOR TEAMS GOVERNED BY STRICT ACCESS CONTROL &amp; COMPLIANCE
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5 opacity-60 font-mono font-semibold text-[13px] text-ink-800 dark:text-parchment-200">
            <span>KINETIC LABS</span>
            <span>MERIDIAN CORP</span>
            <span>CYPHER CORE</span>
            <span>AERIS SYSTEMS</span>
            <span>STRATA INFRA</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. CAPABILITIES BENTO GRID
      ====================================================================== */}
      <section id="capabilities" className="py-20 md:py-28 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-14 text-left">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-copper-700 dark:text-copper-400 mb-2">
              Capabilities
            </div>
            <h2 className="fluid-h2 font-medium text-ink-950 dark:text-parchment-50 tracking-[-0.03em]">
              Everything you need.{' '}
              <span className="font-serif italic text-copper-700 dark:text-copper-500">Nothing</span> you don&#39;t.
            </h2>
            <p className="mt-2 text-[15px] text-ink-600 dark:text-parchment-300">
              Four core operational modules engineered with strict authorization and clean information architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento Card 1 (Span 8): Interactive Time-Off Engine */}
            <div className="md:col-span-8 p-6 sm:p-7 rounded-[10px] bg-white dark:bg-ink-900 border border-black/[0.08] dark:border-white/[0.1] shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-[6px] bg-copper-50 dark:bg-copper-950/60 border border-copper-200 dark:border-copper-900 flex items-center justify-center text-copper-700 dark:text-copper-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400 dark:text-parchment-400">
                    MODULE 01
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold text-ink-950 dark:text-parchment-50">
                  Leave &amp; Time-Off Governance
                </h3>
                <p className="mt-1 text-[13px] text-ink-600 dark:text-parchment-300 max-w-lg leading-relaxed">
                  Automated balance tracking, multi-tier manager reviews, and immediate status updates with full audit history.
                </p>
              </div>

              {/* Interactive Mini UI */}
              <div className="mt-5 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-mono text-ink-500 dark:text-parchment-400 uppercase tracking-wider text-[10px]">
                    INTERACTIVE REVIEW DEMO
                  </span>
                  <div className="flex items-center gap-1.5 bg-parchment-100 dark:bg-ink-800 p-1 rounded-[6px]">
                    <button
                      onClick={() => setLeaveStatus('pending')}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        leaveStatus === 'pending'
                          ? 'bg-white dark:bg-ink-700 shadow-sm font-semibold text-ink-900 dark:text-white'
                          : 'text-ink-500'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setLeaveStatus('approved')}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        leaveStatus === 'approved'
                          ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                          : 'text-ink-500'
                      }`}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => setLeaveStatus('rejected')}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        leaveStatus === 'rejected'
                          ? 'bg-rose-600 text-white shadow-sm font-semibold'
                          : 'text-ink-500'
                      }`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-[6px] bg-parchment-50 dark:bg-ink-850 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold text-ink-900 dark:text-parchment-100">
                      Sophia Vance &bull; Design Lead
                    </div>
                    <div className="font-mono text-[11px] text-ink-500 dark:text-parchment-400 mt-0.5">
                      Dec 18 – Dec 22 &bull; 5 Working Days
                    </div>
                  </div>

                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-medium border ${
                      leaveStatus === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : leaveStatus === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {leaveStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 2 (Span 4): Cryptographic Tenant Isolation */}
            <div className="md:col-span-4 p-6 sm:p-7 rounded-[10px] bg-white dark:bg-ink-900 border border-black/[0.08] dark:border-white/[0.1] shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-[6px] bg-ink-100 dark:bg-ink-800 border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-ink-800 dark:text-parchment-200">
                    <Server className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400 dark:text-parchment-400">
                    MODULE 02
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold text-ink-950 dark:text-parchment-50">
                  Workspace Isolation
                </h3>
                <p className="mt-1 text-[13px] text-ink-600 dark:text-parchment-300 leading-relaxed">
                  Cryptographic realm isolation. Company email domains map to dedicated session partitions and parameterized database scopes.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] font-mono text-[11px] space-y-1.5 text-ink-500 dark:text-parchment-400">
                <div className="flex justify-between">
                  <span>REALM_ID:</span>
                  <span className="text-copper-600 dark:text-copper-400">corp_meridian_prod</span>
                </div>
                <div className="flex justify-between">
                  <span>SESSION_STORE:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">REDIS CLUSTER</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3 (Span 4): Granular RBAC Matrix */}
            <div className="md:col-span-4 p-6 sm:p-7 rounded-[10px] bg-white dark:bg-ink-900 border border-black/[0.08] dark:border-white/[0.1] shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400 dark:text-parchment-400">
                    MODULE 03
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold text-ink-950 dark:text-parchment-50">
                  Role-Based Security
                </h3>
                <p className="mt-1 text-[13px] text-ink-600 dark:text-parchment-300 leading-relaxed">
                  Strict separation across Admin, HR, Manager, and Staff tiers. Access denied before entity evaluation.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1 font-mono text-[11px]">
                <div className="flex justify-between py-0.5">
                  <span className="text-ink-600 dark:text-parchment-400">manage:roles</span>
                  <span className="text-copper-600 dark:text-copper-400 font-semibold">ADMIN</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-ink-600 dark:text-parchment-400">manage:staff</span>
                  <span className="text-ink-900 dark:text-parchment-100">HR, ADMIN</span>
                </div>
              </div>
            </div>

            {/* Bento Card 4 (Span 8): Real-Time Directory & Hierarchy */}
            <div className="md:col-span-8 p-6 sm:p-7 rounded-[10px] bg-white dark:bg-ink-900 border border-black/[0.08] dark:border-white/[0.1] shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-[6px] bg-ink-100 dark:bg-ink-800 border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-ink-800 dark:text-parchment-200">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400 dark:text-parchment-400">
                    MODULE 04
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold text-ink-950 dark:text-parchment-50">
                  Staff Directory &amp; Departments
                </h3>
                <p className="mt-1 text-[13px] text-ink-600 dark:text-parchment-300 max-w-lg leading-relaxed">
                  Searchable employee index with role-based field masking, reporting lines, and departmental distributions.
                </p>
              </div>

              {/* Department metrics */}
              <div className="mt-5 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-[6px] bg-parchment-50 dark:bg-ink-850 border border-black/[0.04] dark:border-white/[0.06]">
                    <div className="font-mono text-[9px] text-copper-600 dark:text-copper-400">ENGINEERING</div>
                    <div className="text-[13px] font-bold text-ink-900 dark:text-parchment-100">10 Members</div>
                  </div>
                  <div className="p-2.5 rounded-[6px] bg-parchment-50 dark:bg-ink-850 border border-black/[0.04] dark:border-white/[0.06]">
                    <div className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400">OPERATIONS</div>
                    <div className="text-[13px] font-bold text-ink-900 dark:text-parchment-100">7 Members</div>
                  </div>
                  <div className="p-2.5 rounded-[6px] bg-parchment-50 dark:bg-ink-850 border border-black/[0.04] dark:border-white/[0.06]">
                    <div className="font-mono text-[9px] text-ink-500 dark:text-parchment-400">LEADERSHIP</div>
                    <div className="text-[13px] font-bold text-ink-900 dark:text-parchment-100">3 Members</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          5. SECURITY & GOVERNANCE (DARK INVERTED SECTION)
      ====================================================================== */}
      <section id="governance" className="py-20 md:py-28 bg-ink-950 text-parchment-100 border-b border-white/[0.1] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-2xl mb-14 text-left">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-copper-400 mb-2">
              Security Specification
            </div>
            <h2 className="fluid-h2 font-medium tracking-[-0.03em] text-white">
              Zero-trust identity &amp; <span className="font-serif italic text-copper-400">governance</span>.
            </h2>
            <p className="mt-2 text-[15px] text-parchment-300">
              Never treat &ldquo;has a Google account&rdquo; as &ldquo;is authorized&rdquo;. Meridian rigorously separates identity from authorization.
            </p>
          </div>

          {/* 4 Flow Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-[8px] bg-ink-900 border border-white/[0.08] space-y-2">
              <div className="font-mono text-[10px] text-copper-400 font-semibold">STAGE 01</div>
              <div className="text-[14px] font-semibold text-white">Google OIDC + PKCE</div>
              <p className="text-[12px] text-parchment-400 leading-relaxed">
                Authorization Code flow with PKCE. Validates issuer, signature, expiry, and email claims.
              </p>
            </div>

            <div className="p-4 rounded-[8px] bg-ink-900 border border-white/[0.08] space-y-2">
              <div className="font-mono text-[10px] text-copper-400 font-semibold">STAGE 02</div>
              <div className="text-[14px] font-semibold text-white">Registry Authorization</div>
              <p className="text-[12px] text-parchment-400 leading-relaxed">
                Checks internal database. If account is absent or INACTIVE, login is denied and audited.
              </p>
            </div>

            <div className="p-4 rounded-[8px] bg-ink-900 border border-white/[0.08] space-y-2">
              <div className="font-mono text-[10px] text-copper-400 font-semibold">STAGE 03</div>
              <div className="text-[14px] font-semibold text-white">Redis Session Store</div>
              <p className="text-[12px] text-parchment-400 leading-relaxed">
                HttpOnly, SameSite=Lax cookie backed by Redis. Zero tokens stored in browser storage.
              </p>
            </div>

            <div className="p-4 rounded-[8px] bg-ink-900 border border-white/[0.08] space-y-2">
              <div className="font-mono text-[10px] text-copper-400 font-semibold">STAGE 04</div>
              <div className="text-[14px] font-semibold text-white">Method-Level RBAC</div>
              <p className="text-[12px] text-parchment-400 leading-relaxed">
                Spring Security @PreAuthorize maps employee role to authorities on every request.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* =====================================================================
          6. HOW IT WORKS (3 STEPS)
      ====================================================================== */}
      <section id="lifecycle" className="py-20 md:py-28 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mb-16 text-left">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-copper-700 dark:text-copper-400 mb-2">
              System Execution
            </div>
            <h2 className="fluid-h2 font-medium text-ink-950 dark:text-parchment-50 tracking-[-0.03em]">
              The three-step <span className="font-serif italic text-copper-700 dark:text-copper-500">authorization</span> loop.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-3 p-5 rounded-[8px] bg-white dark:bg-ink-900 border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-8 h-8 rounded-full bg-parchment-100 dark:bg-ink-800 border border-black/[0.1] dark:border-white/[0.15] flex items-center justify-center font-mono font-bold text-[12px] text-ink-900 dark:text-parchment-100">
                01
              </div>
              <h3 className="text-[15px] font-semibold text-ink-950 dark:text-parchment-50">
                Identity Assertion
              </h3>
              <p className="text-[13px] text-ink-600 dark:text-parchment-300 leading-relaxed">
                User authenticates via Google OAuth 2.0 with PKCE challenge. Google returns cryptographically signed claims verifying email identity.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-[8px] bg-white dark:bg-ink-900 border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-8 h-8 rounded-full bg-parchment-100 dark:bg-ink-800 border border-black/[0.1] dark:border-white/[0.15] flex items-center justify-center font-mono font-bold text-[12px] text-ink-900 dark:text-parchment-100">
                02
              </div>
              <h3 className="text-[15px] font-semibold text-ink-950 dark:text-parchment-50">
                Registry Verification
              </h3>
              <p className="text-[13px] text-ink-600 dark:text-parchment-300 leading-relaxed">
                Custom OidcUserService queries the employee table. Adding an email immediately authorizes sign-in; deactivating immediately terminates access.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-[8px] bg-white dark:bg-ink-900 border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-8 h-8 rounded-full bg-parchment-100 dark:bg-ink-800 border border-black/[0.1] dark:border-white/[0.15] flex items-center justify-center font-mono font-bold text-[12px] text-ink-900 dark:text-parchment-100">
                03
              </div>
              <h3 className="text-[15px] font-semibold text-ink-950 dark:text-parchment-50">
                Ephemeral Session
              </h3>
              <p className="text-[13px] text-ink-600 dark:text-parchment-300 leading-relaxed">
                Session token stored in Redis and bound to authorities. Protected against CSRF, fixation, and client-side token leakage.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* =====================================================================
          7. METRIC BAND & FAQ ACCORDION
      ====================================================================== */}
      <section id="faq" className="py-20 md:py-28 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Numbers Band */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div>
              <div className="font-mono text-[32px] sm:text-[40px] font-bold text-ink-950 dark:text-parchment-50 tracking-tight tabular-nums">
                24,800+
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-500 dark:text-parchment-400 mt-1">
                Directory Profiles Governed
              </div>
            </div>
            <div>
              <div className="font-mono text-[32px] sm:text-[40px] font-bold text-copper-700 dark:text-copper-500 tracking-tight tabular-nums">
                0
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-500 dark:text-parchment-400 mt-1">
                Client Tokens Stored (100% HttpOnly)
              </div>
            </div>
            <div>
              <div className="font-mono text-[32px] sm:text-[40px] font-bold text-ink-950 dark:text-parchment-50 tracking-tight tabular-nums">
                &lt; 45ms
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-500 dark:text-parchment-400 mt-1">
                Authorization Resolution Latency
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-copper-700 dark:text-copper-400 mb-2">
              Specifications
            </div>
            <h2 className="fluid-h2 font-medium text-ink-950 dark:text-parchment-50 tracking-[-0.03em] pb-4">
              Frequently addressed questions.
            </h2>

            <div className="divide-y divide-black/[0.08] dark:divide-white/[0.08] border-t border-b border-black/[0.08] dark:border-white/[0.08]">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className="py-4">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between text-left font-medium text-[15px] text-ink-950 dark:text-parchment-50 focus:outline-none group"
                    >
                      <span className="group-hover:text-copper-700 dark:group-hover:text-copper-400 transition-colors">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-ink-400 dark:text-parchment-400 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-copper-600 dark:text-copper-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-2 text-[13px] text-ink-600 dark:text-parchment-300 leading-relaxed pr-6">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* =====================================================================
          8. CLOSING CTA BANNER
      ====================================================================== */}
      <section className="py-20 bg-parchment-100/80 dark:bg-ink-900 border-b border-black/[0.06] dark:border-white/[0.08] text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="fluid-h2 font-medium text-ink-950 dark:text-parchment-50 tracking-[-0.03em]">
            Ready to initialize your workspace?
          </h2>
          <p className="text-[15px] text-ink-600 dark:text-parchment-300 leading-relaxed">
            Register your company profile or sign in with corporate credentials.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-[6px] bg-ink-900 hover:bg-ink-800 dark:bg-parchment-100 dark:hover:bg-white text-parchment-50 dark:text-ink-950 font-medium text-[14px] shadow-sm transition-all group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-5 rounded-[6px] border border-black/[0.12] dark:border-white/[0.14] text-ink-800 dark:text-parchment-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[14px] font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          9. FOOTER
      ====================================================================== */}
      <footer className="py-12 bg-parchment-50 dark:bg-ink-950 text-ink-600 dark:text-parchment-400 text-[12px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <MeridianMonogram className="text-ink-900 dark:text-parchment-50" size={20} />
            <span className="font-semibold text-ink-900 dark:text-parchment-50">Meridian Systems</span>
            <span>&bull;</span>
            <span>Enterprise Workforce Platform</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>99.99% Operational</span>
            </div>
            <span>&bull;</span>
            <span>&copy; {new Date().getFullYear()} Meridian</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
