import { useEffect, useState, type ComponentType } from "react";
import type { Me } from "./api";
import { AuditLog, Employees } from "./Employees";
import { Memberships } from "./Memberships";
import { useRoute } from "./route";
import {
  ArrowRight,
  Award,
  Inbox,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";

export const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  leads: "Leads",
  memberships: "Memberships",
  audit: "Audit log",
};

export const MODULE_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  dashboard: LayoutDashboard,
  employees: Users,
  memberships: Award,
  audit: ShieldCheck,
  leads: Inbox,
};

/** Friendly names for the realm roles (REQ-IAM-008). Unknown roles fall through unchanged. */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Sales Admin",
  MANAGER: "Manager",
  SALES_EXECUTIVE: "Sales Executive",
};

/** The workspaces offered on the start screen. Both open the same Keycloak login: the card only
 *  starts the flow, the account's role decides what loads (backend enforces every request). */
const WORKSPACES = [
  { role: "ADMIN", title: "Sales Admin", detail: "Sales team, lead performance and the audit log" },
  { role: "SALES_EXECUTIVE", title: "Sales Executive", detail: "Gold Membership registrations" },
];

/** What each module is for, in one line, for the dashboard. */
const MODULE_LINES: Record<string, string> = {
  employees: "Staff accounts and invitations",
  memberships: "Register Gold members and verify payments",
  audit: "Every access and role change, as it happened",
  leads: "Guest enquiries from the website",
};

const BRAND = import.meta.env.BASE_URL + "brand/";

function getInitials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "GH";
}

export function SignIn({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="signin">
      <div className="signin-art" aria-hidden="true">
        <img src={BRAND + "logo-light.png"} alt="" className="signin-art-logo" />
        <p className="signin-art-line">Staff console</p>
        <svg className="signin-hills" viewBox="0 0 600 160" preserveAspectRatio="none">
          <path d="M0 160 C 120 60 220 40 300 90 C 380 40 480 50 600 120 L 600 160 Z" />
          <path d="M0 160 C 140 100 260 90 360 120 C 440 100 520 110 600 140 L 600 160 Z" />
        </svg>
      </div>
      <main className="signin-card">
        <img src={BRAND + "logo-color.png"} alt="Golden Hills Resort" className="signin-logo" />
        <h1>Sign in to the staff console</h1>
        <p>Choose your workspace. Your account decides what opens.</p>
        <div className="role-picker">
          {WORKSPACES.map((w) => (
            <button key={w.role} type="button" className="role-choice" onClick={onSignIn}>
              <span className="role-choice-text">
                <strong>{w.title}</strong>
                <small>{w.detail}</small>
              </span>
              <ArrowRight size={18} className="role-choice-arrow" aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className="hint">The card only starts the sign-in; no password is asked for here.</p>
      </main>
    </div>
  );
}

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

/** Light or dark, remembered per browser; follows the system the first time. */
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("gh_erp_theme");
      if (saved === "dark" || saved === "light") return saved;
      if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    } catch {
      // storage or matchMedia unavailable (private window, tests): light
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("gh_erp_theme", theme); } catch { /* not remembered */ }
  }, [theme]);

  return [theme, () => setTheme((t) => (t === "light" ? "dark" : "light"))] as const;
}

export function Dashboard({ loadMe, onSignOut, request }: { loadMe: () => Promise<Me>; onSignOut: () => void; request?: Request }) {
  const [me, setMe] = useState<Me | null>(null);
  const [page] = useRoute();   // "#employees/performance/rohan" → "employees"
  const [error, setError] = useState<string | null>(null);
  const [theme, toggleTheme] = useTheme();

  // Live figures for the dashboard (only roles that have one, e.g. Manager)
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [pendingMemberships, setPendingMemberships] = useState<number | null>(null);
  const [auditCount, setAuditCount] = useState<number | null>(null);

  useEffect(() => {
    loadMe().then(setMe, (e: Error) => setError(e.message || "Could not load your profile."));
  }, [loadMe]);

  const hasDashboard = !!me?.modules.includes("dashboard");
  useEffect(() => {
    if (!request || !me || !hasDashboard) return;
    if (me.modules.includes("employees")) {
      request<{ total: number }>("/api/v1/admin/employees?size=1").then((p) => setEmployeeCount(p.total)).catch(() => {});
    }
    if (me.permissions.includes("memberships.read_all")) {
      request<{ total: number; pendingCount: number | null }>("/api/v1/admin/memberships?status=PENDING_VERIFICATION&size=1")
        .then((p) => setPendingMemberships(p.pendingCount ?? p.total)).catch(() => {});
    }
    if (me.modules.includes("audit")) {
      request<{ total: number }>("/api/v1/admin/audit?size=1").then((p) => setAuditCount(p.total)).catch(() => {});
    }
  }, [request, me, hasDashboard]);

  if (error) {
    return (
      <main className="erp-state">
        <p role="alert">{error}</p>
        <button onClick={onSignOut}>Sign out</button>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="erp-state">
        <span className="erp-spinner" aria-hidden="true" />
        <p>Loading…</p>
      </main>
    );
  }

  const name = me.employee ? `${me.employee.firstName} ${me.employee.lastName}` : null;
  const initials = me.employee ? getInitials(me.employee.firstName, me.employee.lastName) : "GH";
  const friendlyRole = me.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ") || "no role";
  // Without a "dashboard" module the first module is the home page: Memberships for a Sales Executive (shown as
  // "Dashboard", D-135), Employees for the Sales Admin (keeps its name, D-137).
  const home = hasDashboard ? "dashboard" : (me.modules[0] ?? "dashboard");
  const current = page && me.modules.includes(page) ? page : home;
  const label = (m: string) => (m === home && m === "memberships" ? "Dashboard" : MODULE_LABELS[m] ?? m);
  const icon = (m: string) => (m === home && m === "memberships" ? LayoutDashboard : MODULE_ICONS[m] ?? LayoutDashboard);
  const isSalesAdmin = me.roles.includes("ADMIN");

  const navigateTo = (mod: string) => { window.location.hash = `#${mod}`; };
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  /* The figures this person can open, each with its live count. */
  const figures = [
    me.modules.includes("employees") && { id: "employees", label: "Employees", value: employeeCount },
    me.modules.includes("audit") && { id: "audit", label: "Audit events", value: auditCount },
  ].filter(Boolean) as { id: string; label: string; value: number | null }[];
  const otherModules = me.modules.filter((m) => m !== "dashboard");

  return (
    <div className="erp">
      <aside className="erp-side">
        <div className="erp-brand">
          <img src={BRAND + "logo-light.png"} alt="Golden Hills Resort" />
          <span>Staff console</span>
        </div>

        <nav aria-label="Modules" className="erp-nav">
          {/* Visibility only; the backend checks every request (AUTHENTICATION §5 step 6). */}
          {me.modules.map((m) => {
            const isActive = current === m;
            const Icon = icon(m);
            return (
              <a
                key={m}
                href={`#${m}`}
                className={`erp-nav-item${isActive ? " active" : ""}`}
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label(m)}</span>
              </a>
            );
          })}
        </nav>

        <div className="erp-user">
          <span className="erp-user-avatar" aria-hidden="true">{initials}</span>
          <span className="erp-user-info">
            <span className="erp-user-name">{name ?? "Signed in"}</span>
            <span className="erp-user-role">{friendlyRole}</span>
          </span>
          <button type="button" className="erp-signout" onClick={onSignOut} title="End session" aria-label="Sign out">
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="erp-main">
        <header className="erp-top">
          <p className="erp-top-title">{label(current)}</p>
          <div className="erp-top-actions">
            <button
              type="button"
              className="erp-icon-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>
        </header>

        <main className="erp-canvas">
          {!name ? (
            <p role="alert" className="erp-notice">Your sign-in works, but your ERP employee record is not set up yet. Ask an administrator.</p>
          ) : current === "employees" && request ? (
            <Employees request={request} canManage={me.permissions.includes("employees.manage")} showPerformance={isSalesAdmin} />
          ) : current === "memberships" && request ? (
            <Memberships me={me} request={request} />
          ) : current === "audit" && request ? (
            <AuditLog request={request} />
          ) : (
            <section className="dash">
              <header className="page-head">
                <p className="page-kicker">{today}</p>
                <h1>Welcome, {name}</h1>
                <p>Golden Hills Resort, Biligi · {otherModules.length} {otherModules.length === 1 ? "workspace" : "workspaces"} open to you</p>
              </header>

              {/* The one thing waiting on this person: payments to verify. */}
              {me.permissions.includes("memberships.read_all") && me.modules.includes("memberships") && (
                <button type="button" className="dash-lead" onClick={() => navigateTo("memberships")}>
                  <span className="dash-lead-label">Gold memberships waiting to be verified</span>
                  <span className="dash-lead-figure">{pendingMemberships ?? "—"}</span>
                  <span className="dash-lead-cta">Open the verification queue <ArrowRight size={16} aria-hidden="true" /></span>
                  <svg className="dash-lead-hills" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 120 C 80 40 150 30 210 70 C 270 30 340 40 400 90 L 400 120 Z" />
                  </svg>
                </button>
              )}

              {figures.length > 0 && (
                <div className="dash-figures">
                  {figures.map((f) => (
                    <button key={f.id} type="button" className="dash-figure" onClick={() => navigateTo(f.id)}>
                      <span className="dash-figure-label">{f.label}</span>
                      <span className="dash-figure-value">{f.value ?? "—"}</span>
                      <ArrowRight size={16} className="dash-figure-arrow" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}

              {(me.permissions.includes("employees.manage") || me.permissions.includes("memberships.register")) && (
                <div className="dash-actions">
                  {me.permissions.includes("employees.manage") && (
                    <button type="button" className="btn-secondary" onClick={() => navigateTo("employees")}>
                      <Plus size={15} aria-hidden="true" />
                      <span>Add employee</span>
                    </button>
                  )}
                  {me.permissions.includes("memberships.register") && (
                    <button type="button" className="btn-secondary" onClick={() => navigateTo("memberships")}>
                      <Plus size={15} aria-hidden="true" />
                      <span>Register member</span>
                    </button>
                  )}
                </div>
              )}

              {otherModules.length > 0 && (
                <div className="dash-modules">
                  <h2>Your workspaces</h2>
                  <ul>
                    {otherModules.map((m) => {
                      const Icon = MODULE_ICONS[m] ?? LayoutDashboard;
                      return (
                        <li key={m}>
                          <button type="button" className="dash-module" onClick={() => navigateTo(m)}>
                            <span className="dash-module-icon" aria-hidden="true"><Icon size={18} /></span>
                            <span className="dash-module-text">
                              <strong>{MODULE_LABELS[m] ?? m}</strong>
                              <small>{MODULE_LINES[m] ?? ""}</small>
                            </span>
                            <ArrowRight size={16} className="dash-module-arrow" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
