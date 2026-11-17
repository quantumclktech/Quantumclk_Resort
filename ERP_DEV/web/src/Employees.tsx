// Employees admin (api.md §3; AUTHENTICATION §4, §8). The backend checks permissions; this only hides what can't be used.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError } from "./api";
import { navigate, useRoute } from "./route";
import { SalesPerformance } from "./SalesPerformance";
import { maskPan, panNormalised, panProblem } from "./smartFields";
import { BarChart3, RefreshCw, Search, Shield, UserPlus, Users } from "lucide-react";

export interface Employee {
  id: string; firstName: string; lastName: string; email: string; username: string; mobile: string;
  jobRole: string; status: string; statusReason: string | null; identityLinked: boolean;
  /** XXXXXX234F; the full PAN is never returned or stored (D-139). Null for employees added before PAN. */
  panMasked?: string | null;
}
interface Page<T> { items: T[]; page: number; size: number; total: number }
type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export const STATUS_LABELS: Record<string, string> = {
  PENDING_PROVISIONING: "Setting up",
  INVITED: "Invited",
  INVITE_EMAIL_FAILED: "Invite email failed",
  ACTIVE: "Active",
  DISABLED: "Disabled",
};
const ROLE_LABELS: Record<string, string> = { SALES_EXECUTIVE: "Sales executive", MANAGER: "Manager", ADMIN: "Administrator" };
// D-138: the ERP creates Sales Executives only; there is no role picker and no promotion.
const EMPTY = { firstName: "", lastName: "", email: "", username: "", mobile: "", pan: "", jobRole: "SALES_EXECUTIVE", whatsappOptIn: false };

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "GH";
}

/**
 * Employees page. With `showPerformance` (Sales Admin, D-137) it has two tabs: Team Roster and Sales Performance.
 * Routes: #employees, #employees/performance, #employees/performance/<username>.
 */
export function Employees({ request, canManage, showPerformance = false }: { request: Request; canManage: boolean; showPerformance?: boolean }) {
  const route = useRoute();
  const tab = showPerformance && route[0] === "employees" && route[1] === "performance" ? "performance" : "roster";

  return (
    <section>
      <header className="page-head">
        <p className="page-kicker">People</p>
        <h1>Employees</h1>
      </header>

      {showPerformance && (
        <div className="mem-tabs" role="tablist" aria-label="Employees">
          <button type="button" role="tab" aria-selected={tab === "roster"} className={tab === "roster" ? "active" : ""}
                  onClick={() => navigate("employees")}>
            <Users size={15} aria-hidden="true" />
            <span>Team Roster</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === "performance"} className={tab === "performance" ? "active" : ""}
                  onClick={() => navigate("employees", "performance")}>
            <BarChart3 size={15} aria-hidden="true" />
            <span>Sales Performance</span>
          </button>
        </div>
      )}

      {tab === "performance"
        ? <SalesPerformance request={request} selected={route[2]} />
        : <Roster request={request} canManage={canManage} showPerformance={showPerformance} />}
    </section>
  );
}

function Roster({ request, canManage, showPerformance }: { request: Request; canManage: boolean; showPerformance: boolean }) {
  const [list, setList] = useState<Employee[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    request<Page<Employee>>("/api/v1/admin/employees?size=100").then((p) => setList(p.items), (e: Error) => setError(e.message));
  }, [request]);
  useEffect(load, [load]);

  async function act(path: string, init: RequestInit = { method: "POST" }) {
    setError(null);
    try {
      await request(path, init);
    } catch (e) {
      setError((e as Error).message);
    }
    load();
  }
  const base = (id: string) => `/api/v1/admin/employees/${id}`;
  // A reason is required for account changes; it goes into the audit trail (AUTHENTICATION §7).
  const withReason = (question: string, send: (reason: string) => void) => {
    const reason = window.prompt(question)?.trim();
    if (reason) send(reason);
  };
  const setActive = (e: Employee, active: boolean) => withReason(
    active ? `Why reactivate ${e.firstName} ${e.lastName}?` : `Why deactivate ${e.firstName} ${e.lastName}? They will be signed out everywhere.`,
    (reason) => void act(`${base(e.id)}/status`, { method: "PATCH", body: JSON.stringify({ active, reason }) }));
  const filtered = list?.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)
      || e.username.toLowerCase().includes(q)
      || e.email.toLowerCase().includes(q)
      || (ROLE_LABELS[e.jobRole] ?? e.jobRole).toLowerCase().includes(q);
  });

  return (
    <>
      {canManage && <AddEmployee request={request} onCreated={load} />}

      {error && <p role="alert">{error}</p>}

      {!list ? (
        <p>Loading…</p>
      ) : (
        <div className="table-card">
          <div className="table-header-bar">
            <div className="table-title-group">
              <Users size={18} aria-hidden="true" />
              <h2>Team roster</h2>
              <span className="count-badge">
                {list.length} {list.length === 1 ? "Employee" : "Employees"}
              </span>
            </div>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={15} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by name, email, or role…"
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
                aria-label="Filter employees"
              />
            </div>
          </div>

          <div className="table-container">
            <table className="cards-on-phone">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filtered ?? []).map((e) => {
                  const statusKey = e.status.toLowerCase();
                  return (
                    <tr key={e.id}>
                      <td>
                        <div className="user-cell">
                          <div className="row-avatar">{getInitials(e.firstName, e.lastName)}</div>
                          <div className="row-user-info">
                            <span className="row-name">{e.firstName} {e.lastName}</span>
                            <span className="row-sub">{e.mobile}{e.panMasked ? ` · PAN ${e.panMasked}` : ""}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Username"><code>{e.username}</code></td>
                      <td data-label="Email">{e.email}</td>
                      <td data-label="Role">
                        <span className={`role-badge role-${e.jobRole.toLowerCase()}`}>
                          {ROLE_LABELS[e.jobRole] ?? e.jobRole}
                        </span>
                      </td>
                      <td data-label="Account" title={e.statusReason ?? ""}>
                        <span className={`status-pill status-${statusKey}`}>
                          <span className="status-dot"></span>
                          <span>
                            {STATUS_LABELS[e.status] ?? e.status}
                            {e.statusReason ? ` — ${e.statusReason}` : ""}
                          </span>
                        </span>
                      </td>
                      <td className="actions">
                        {canManage && (e.status === "PENDING_PROVISIONING" || (e.status === "INVITE_EMAIL_FAILED" && !e.identityLinked)) && (
                          <button className="btn-secondary" onClick={() => void act(`${base(e.id)}/retry-provisioning`)}>
                            Retry
                          </button>
                        )}
                        {canManage && e.identityLinked && (e.status === "INVITED" || e.status === "INVITE_EMAIL_FAILED") && (
                          <button className="btn-outline" onClick={() => void act(`${base(e.id)}/resend-invite`)}>
                            Resend invite
                          </button>
                        )}
                        {canManage && e.identityLinked && e.status !== "DISABLED" && (
                          <button className="btn-secondary" onClick={() => setActive(e, false)}>
                            Deactivate
                          </button>
                        )}
                        {canManage && e.status === "DISABLED" && (
                          <button className="btn-outline" onClick={() => setActive(e, true)}>
                            Activate
                          </button>
                        )}
                        {showPerformance && e.jobRole === "SALES_EXECUTIVE" && (
                          <button className="btn-outline" aria-label={`View leads for ${e.firstName} ${e.lastName}`}
                                  onClick={() => navigate("employees", "performance", e.username)}>
                            View leads
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function AddEmployee({ request, onCreated }: { request: Request; onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY);
  // One key per submission: a double click or network retry can't create the employee twice.
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY) => (v: string | boolean) => setForm({ ...form, [k]: v });

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const pan = panProblem(form.pan);
    if (pan) { setFields({ pan }); setMessage(null); return; }   // the server checks it too
    setBusy(true); setFields({}); setMessage(null);
    try {
      const e = await request<Employee>("/api/v1/admin/employees", {
        method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(form),
      });
      setMessage(e.status === "INVITED"
        ? `${e.firstName} ${e.lastName} was invited. They will get an email to verify their address and set a password.`
        : `${e.firstName} ${e.lastName} was saved. ${e.statusReason ?? "Account setup will finish automatically."}`);
      setForm(EMPTY); setKey(crypto.randomUUID()); onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields((err.body as { fields?: Record<string, string> } | null)?.fields ?? {});
        if (err.status !== 422) setKey(crypto.randomUUID()); // corrected input = a new request
      }
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const input = (k: "firstName" | "lastName" | "email" | "username" | "mobile", label: string, type = "text", placeholder = "") => (
    <label>{label}
      <input
        type={type}
        required
        value={form[k]}
        placeholder={placeholder}
        onChange={(e) => set(k)(e.target.value)}
        aria-invalid={!!fields[k]}
      />
      {fields[k] && <small role="alert">{fields[k]}</small>}
    </label>
  );

  return (
    <div className="form-card">
      <div className="form-header">
        <div>
          <h2>
            <UserPlus size={18} aria-hidden="true" />
            Add employee
          </h2>
        </div>
      </div>

      <form onSubmit={(e) => void submit(e)} aria-label="Add employee">
        <div className="form-row two-col">
          {input("firstName", "First name", "text", "e.g. Rohan")}
          {input("lastName", "Last name", "text", "e.g. Sharma")}
        </div>

        <div className="form-row three-col">
          {input("email", "Email", "email", "name@example.com")}
          {input("username", "Username", "text", "e.g. rohan")}
          {input("mobile", "Mobile (e.g. +91 98765 43210)", "tel", "+91 98765 43210")}
        </div>

        <div className="form-row two-col">
          <label>PAN
            <input
              type="text"
              aria-label="PAN"
              required
              value={form.pan}
              placeholder="e.g. ABCPE1234F"
              autoComplete="off"
              spellCheck={false}
              maxLength={14}
              style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
              onChange={(e) => set("pan")(panNormalised(e.target.value))}
              aria-invalid={!!fields.pan || (form.pan.length === 10 && !!panProblem(form.pan))}
            />
            {fields.pan ? <small role="alert">{fields.pan}</small>
              : form.pan.length === 10 && (panProblem(form.pan)
                ? <span className="smart-pill bad" aria-live="polite">{panProblem(form.pan)}</span>
                : <span className="smart-pill ok" aria-live="polite">Valid PAN · saved as {maskPan(form.pan)}</span>)}
            <span className="smart-note">Only a masked PAN is stored; the full number is never kept.</span>
          </label>
        </div>

        <div className="role-fixed" aria-label="Job role">
          <span className="role-badge role-sales_executive">Sales executive</span>
          <small>Front desk, guest bookings &amp; enquiries. Only Sales Executive accounts can be created.</small>
        </div>

        <div className="form-footer">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.whatsappOptIn}
              onChange={(e) => set("whatsappOptIn")(e.target.checked)}
            />
            <span>WhatsApp notifications</span>
          </label>

          <button type="submit" disabled={busy}>
            {busy ? (
              <>
                <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} aria-hidden="true" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <UserPlus size={14} aria-hidden="true" />
                <span>Add employee</span>
              </>
            )}
          </button>
        </div>

        {message && <p role="status">{message}</p>}
      </form>
    </div>
  );
}

interface AuditEntry { id: string; occurredAt: string; actor: string; action: string; entityId: string | null; reason: string | null; outcome: string }

export function AuditLog({ request }: { request: Request }) {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    request<Page<AuditEntry>>("/api/v1/admin/audit?size=100").then((p) => setRows(p.items), (e: Error) => setError(e.message));
  }, [request]);

  return (
    <section>
      <header className="page-head">
        <p className="page-kicker">Security</p>
        <h1>Audit log</h1>
      </header>

      {error && <p role="alert">{error}</p>}

      {!rows ? (
        <p>Loading…</p>
      ) : (
        <div className="table-card">
          <div className="table-header-bar">
            <div className="table-title-group">
              <Shield size={18} aria-hidden="true" />
              <h2>Events</h2>
              <span className="count-badge">{rows.length}</span>
            </div>
          </div>
          <div className="table-container">
            <table className="cards-on-phone">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>What</th>
                  <th>Reason</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isSuccess = r.outcome.toUpperCase() === "SUCCESS";
                  return (
                    <tr key={r.id}>
                      <td data-label="When" className="audit-when">
                        {new Date(r.occurredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td data-label="Who">
                        <strong className="audit-actor">{r.actor}</strong>
                      </td>
                      <td data-label="What">
                        <code className="audit-action">{r.action}</code>
                      </td>
                      <td data-label="Reason" className={r.reason ? "" : "is-empty"}>{r.reason ?? "—"}</td>
                      <td data-label="Outcome">
                        <span className={`status-pill ${isSuccess ? "status-active" : "status-failed"}`}>
                          <span className="status-dot"></span>
                          <span>{r.outcome}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
