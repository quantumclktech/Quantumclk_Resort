// Sales Admin: how each Sales Executive is doing with leads (D-137). Lives under Employees → Sales Performance.
// Data: lead-service GET /api/v1/sales/leads/summary and /api/v1/sales/leads (Sales Admin only, enforced there).
import { useEffect, useMemo, useState } from "react";
import type { ExecutiveLeadSummary, ExecutiveMemberships, LeadRecord, MembershipSummary, TeamLeadSummary } from "./api";
import type { Employee } from "./Employees";
import { MEMBER_STATUS, type Member } from "./Memberships";
import { navigate } from "./route";
import { rupees } from "./smartFields";

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;
interface Page<T> { items: T[]; page: number; size: number; total: number }

export type Period = "week" | "month" | "90d" | "all";
export const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All time" },
];

/** Leads need at least this many attended before their executive can be "Top performer" (a 1-for-1 doesn't win). */
export const MIN_ATTENDED_FOR_TOP = 5;

/** Start of the period in the viewer's local time (weeks start on Monday), or null for all time. */
export function periodStart(p: Period, now = new Date()): Date | null {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "week") { d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
  if (p === "month") { d.setDate(1); return d; }
  if (p === "90d") { d.setDate(d.getDate() - 90); return d; }
  return null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "New", cls: "lead-new" },
  IN_PROGRESS: { label: "In progress", cls: "lead-progress" },
  CONVERTED: { label: "Converted", cls: "lead-converted" },
  LOST: { label: "Lost", cls: "lead-lost" },
};

export interface Row {
  username: string;
  name: string;
  email: string;
  s: ExecutiveLeadSummary;
  /** Memberships brought in (D-140). */
  m: ExecutiveMemberships;
}

const zero = (username: string): ExecutiveLeadSummary => ({
  username, attendedCount: 0, inProgressCount: 0, convertedCount: 0, lostCount: 0, conversionRate: 0, avgFirstResponseMinutes: null,
});
const zeroM = (username: string, name = username): ExecutiveMemberships => ({
  employeeId: "", username, name, enrolledCount: 0, activeCount: 0, pendingCount: 0, rejectedCount: 0, verifiedAmount: "0.00",
});

/** Display only: amounts arrive as two-decimal strings and totals are summed on the server, never here. */
const inr = (amount: string) => rupees(Number(amount));

/** Most active (verified) memberships, then most verified money; needs at least one. */
export function topInMemberships(rows: Row[]): Row | undefined {
  return [...rows].filter((r) => r.m.activeCount > 0)
    .sort((a, b) => b.m.activeCount - a.m.activeCount || Number(b.m.verifiedAmount) - Number(a.m.verifiedAmount))[0];
}

/** Best first: most converted, then best conversion rate, then most attended. */
export function rank(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => b.s.convertedCount - a.s.convertedCount
    || b.s.conversionRate - a.s.conversionRate || b.s.attendedCount - a.s.attendedCount || a.name.localeCompare(b.name));
}

export function topPerformer(ranked: Row[]): Row | undefined {
  return ranked.find((r) => r.s.attendedCount >= MIN_ATTENDED_FOR_TOP && r.s.convertedCount > 0);
}

export function formatMinutes(m: number | null | undefined) {
  if (m == null) return "—";
  if (m < 60) return `${Math.round(m)} min`;
  if (m < 60 * 24) return `${(m / 60).toFixed(1)} h`;
  return `${(m / 60 / 24).toFixed(1)} d`;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso
    : d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0] ?? "").join("").slice(0, 2).toUpperCase() || "SE";
}

/** Converted / in progress / lost as one bar, as shares of attended. */
function StatusBar({ s }: { s: ExecutiveLeadSummary }) {
  if (s.attendedCount === 0) return <div className="perf-bar perf-bar-empty" aria-hidden="true" />;
  const w = (n: number) => `${(n / s.attendedCount) * 100}%`;
  return (
    <div className="perf-bar" role="img"
         aria-label={`${s.convertedCount} converted, ${s.inProgressCount} in progress, ${s.lostCount} lost`}>
      <span className="seg-converted" style={{ width: w(s.convertedCount) }} />
      <span className="seg-progress" style={{ width: w(s.inProgressCount) }} />
      <span className="seg-lost" style={{ width: w(s.lostCount) }} />
    </div>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div className={`perf-kpi${tone ? ` tone-${tone}` : ""}`}>
      <span className="perf-kpi-label">{label}</span>
      <strong className="perf-kpi-value">{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

type SortKey = "rank" | "attendedCount" | "convertedCount" | "conversionRate" | "avgFirstResponseMinutes" | "memberships" | "revenue";

function sortValue(r: Row, key: Exclude<SortKey, "rank">): number {
  if (key === "memberships") return r.m.activeCount;
  if (key === "revenue") return Number(r.m.verifiedAmount);
  return r.s[key] ?? Infinity;
}

export function SalesPerformance({ request, selected }: { request: Request; selected?: string }) {
  const [period, setPeriod] = useState<Period>("month");
  const [executives, setExecutives] = useState<Employee[] | null>(null);
  const [summary, setSummary] = useState<TeamLeadSummary | null>(null);
  const [members, setMembers] = useState<MembershipSummary | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "rank", desc: false });

  const from = useMemo(() => periodStart(period)?.toISOString(), [period]);
  const qs = from ? `?from=${encodeURIComponent(from)}` : "";

  useEffect(() => {
    request<Page<Employee>>("/api/v1/admin/employees?size=100&role=SALES_EXECUTIVE")
      .then((p) => setExecutives(p.items.filter((e) => e.jobRole === "SALES_EXECUTIVE")),
            (e: Error) => setError(e.message || "Could not load the sales team."));
  }, [request]);

  useEffect(() => {
    setSummary(null);
    request<TeamLeadSummary>(`/api/v1/sales/leads/summary${qs}`)
      .then(setSummary, (e: Error) => setError(e.message || "Could not load lead performance."));
    // Memberships come from another service: if they fail, lead numbers still show.
    setMembers(null); setMembersError(null);
    request<MembershipSummary>(`/api/v1/admin/memberships/summary${qs}`)
      .then(setMembers, (e: Error) => setMembersError(e.message || "Could not load memberships."));
  }, [request, qs]);

  const rows: Row[] = useMemo(() => {
    if (!executives || !summary) return [];
    const byUser = new Map(summary.executives.map((s) => [s.username, s]));
    const memByUser = new Map((members?.executives ?? []).map((m) => [m.username, m]));
    const list: Row[] = executives.map((e) => ({
      username: e.username, name: `${e.firstName} ${e.lastName}`, email: e.email, s: byUser.get(e.username) ?? zero(e.username),
      m: memByUser.get(e.username) ?? zeroM(e.username),
    }));
    // Leads or memberships of someone no longer on the roster (or not a Sales Executive) still count.
    const known = new Set(list.map((r) => r.username));
    for (const s of summary.executives) {
      if (!known.has(s.username)) {
        known.add(s.username);
        list.push({ username: s.username, name: memByUser.get(s.username)?.name ?? s.username, email: "", s, m: memByUser.get(s.username) ?? zeroM(s.username) });
      }
    }
    for (const m of members?.executives ?? []) {
      if (!known.has(m.username)) list.push({ username: m.username, name: m.name, email: "", s: zero(m.username), m });
    }
    return list;
  }, [executives, summary, members]);

  const ranked = useMemo(() => rank(rows), [rows]);
  const top = topPerformer(ranked);
  const topMem = topInMemberships(rows);
  const position = new Map(ranked.map((r, i) => [r.username, i + 1]));
  const sortKey = sort.key;
  const sorted = sortKey === "rank" ? ranked : [...ranked].sort((a, b) => {
    const av = sortValue(a, sortKey);
    const bv = sortValue(b, sortKey);
    return (sort.desc ? bv - av : av - bv) || (position.get(a.username)! - position.get(b.username)!);
  });

  const totals = rows.reduce((t, r) => ({
    attended: t.attended + r.s.attendedCount,
    converted: t.converted + r.s.convertedCount,
    inProgress: t.inProgress + r.s.inProgressCount,
    lost: t.lost + r.s.lostCount,
    // Response time weighted by attended leads, over executives where it is known.
    respSum: t.respSum + (r.s.avgFirstResponseMinutes ?? 0) * (r.s.avgFirstResponseMinutes == null ? 0 : r.s.attendedCount),
    respN: t.respN + (r.s.avgFirstResponseMinutes == null ? 0 : r.s.attendedCount),
  }), { attended: 0, converted: 0, inProgress: 0, lost: 0, respSum: 0, respN: 0 });

  const periodLabel = PERIODS.find((p) => p.id === period)!.label;
  const selectedRow = selected ? rows.find((r) => r.username === selected) : undefined;

  const header = (key: SortKey, label: string) => {
    const active = sort.key === key;
    return (
      <th aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}>
        <button type="button" className="perf-sort"
                onClick={() => setSort(active ? { key, desc: !sort.desc } : { key, desc: key !== "rank" && key !== "avgFirstResponseMinutes" })}>
          {label}{active ? (sort.desc ? " ↓" : " ↑") : ""}
        </button>
      </th>
    );
  };

  return (
    <div className="perf">
      <div className="perf-toolbar">
        <div>
          <h2>Sales Performance</h2>
          <p>Leads each Sales Executive attended and converted, and the Gold Memberships they brought in. Counted by the date the lead came in or the member registered.</p>
        </div>
        <div className="perf-periods" role="group" aria-label="Period">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" className={period === p.id ? "active" : ""} aria-pressed={period === p.id}
                    onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      {!executives || !summary ? (
        <p>Loading…</p>
      ) : selected ? (
        <ExecutiveLeads request={request} row={selectedRow ?? { username: selected, name: selected, email: "", s: zero(selected), m: zeroM(selected) }}
                        from={from}
                        position={position.get(selected)} teamSize={rows.length} qs={qs} periodLabel={periodLabel} />
      ) : (
        <>
          <div className="perf-kpis">
            <Kpi label="Sales executives" value={executives.length} />
            <Kpi label="Leads attended" value={totals.attended} hint={periodLabel} />
            <Kpi label="Converted" value={totals.converted} tone="good" />
            <Kpi label="Conversion rate" value={totals.attended ? pct(totals.converted / totals.attended) : "—"} tone="good" />
            <Kpi label="Avg first response" value={formatMinutes(totals.respN ? totals.respSum / totals.respN : null)}
                 hint="Lead in → claimed" />
            <Kpi label="Unclaimed leads" value={summary.unclaimedCount} tone={summary.unclaimedCount ? "warn" : undefined}
                 hint="New, nobody picked up" />
            <Kpi label="Memberships sold" value={members ? members.activeCount : "—"} tone="good"
                 hint={members ? `${members.pendingCount} awaiting verification` : membersError ?? "Loading…"} />
            <Kpi label="Membership revenue" value={members ? inr(members.verifiedAmount) : "—"} tone="good" hint="Verified payments" />
          </div>

          {top && (
            <div className="perf-top" role="note" aria-label="Top in leads">
              <span className="perf-top-badge">Top in leads</span>
              <strong>{top.name}</strong>
              <span>
                {top.s.convertedCount} converted of {top.s.attendedCount} attended ({pct(top.s.conversionRate)}) · {periodLabel.toLowerCase()}
              </span>
            </div>
          )}
          {topMem && (
            <div className="perf-top" role="note" aria-label="Top in memberships">
              <span className="perf-top-badge">Top in memberships</span>
              <strong>{topMem.name}</strong>
              <span>
                {topMem.m.activeCount} {topMem.m.activeCount === 1 ? "membership" : "memberships"} sold · {inr(topMem.m.verifiedAmount)} verified · {periodLabel.toLowerCase()}
              </span>
            </div>
          )}
          {membersError && <p className="perf-note" role="alert">Memberships could not be loaded: {membersError}</p>}

          <div className="table-card">
            <div className="table-header-bar">
              <div className="table-title-group">
                <h2>Leaderboard</h2>
                <span className="count-badge">{rows.length} {rows.length === 1 ? "Executive" : "Executives"}</span>
              </div>
              <div className="perf-legend" aria-hidden="true">
                <span><i className="seg-converted" />Converted</span>
                <span><i className="seg-progress" />In progress</span>
                <span><i className="seg-lost" />Lost</span>
              </div>
            </div>
            {rows.length === 0 ? (
              <p className="perf-empty">No Sales Executives yet. Add one in Team Roster.</p>
            ) : (
              <div className="table-container">
                <table className="cards-on-phone" aria-label="Sales executive leaderboard">
                  <thead>
                    <tr>
                      {header("rank", "#")}
                      <th>Executive</th>
                      {header("attendedCount", "Attended")}
                      <th>In progress</th>
                      {header("convertedCount", "Converted")}
                      <th>Lost</th>
                      {header("conversionRate", "Conversion")}
                      {header("avgFirstResponseMinutes", "Avg response")}
                      <th className="perf-bar-col">Outcome</th>
                      {header("memberships", "Memberships")}
                      {header("revenue", "Revenue")}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr key={r.username} className="perf-row" onClick={() => navigate("employees", "performance", r.username)}>
                        <td className="perf-rank">{position.get(r.username)}</td>
                        <td>
                          <div className="user-cell">
                            <div className="row-avatar">{initials(r.name)}</div>
                            <div className="row-user-info">
                              <button type="button" className="perf-name"
                                      onClick={(e) => { e.stopPropagation(); navigate("employees", "performance", r.username); }}>
                                {r.name}
                              </button>
                              <span className="row-sub">
                                @{r.username}
                                {top?.username === r.username && <span className="perf-star"> ★ Leads</span>}
                                {topMem?.username === r.username && <span className="perf-star"> ★ Memberships</span>}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Attended"><strong>{r.s.attendedCount}</strong></td>
                        <td data-label="In progress">{r.s.inProgressCount}</td>
                        <td data-label="Converted" className="perf-good">{r.s.convertedCount}</td>
                        <td data-label="Lost">{r.s.lostCount}</td>
                        <td data-label="Conversion">{r.s.attendedCount ? pct(r.s.conversionRate) : "—"}</td>
                        <td data-label="Avg response">{formatMinutes(r.s.avgFirstResponseMinutes)}</td>
                        <td data-label="Outcome" className="perf-bar-col"><StatusBar s={r.s} /></td>
                        <td data-label="Memberships">
                          <strong className="perf-good">{r.m.activeCount}</strong>
                          {r.m.pendingCount > 0 && <span className="row-sub"> +{r.m.pendingCount} pending</span>}
                        </td>
                        <td data-label="Revenue" className="perf-money">{inr(r.m.verifiedAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ExecutiveLeads({ request, row, position, teamSize, qs, periodLabel, from }: {
  request: Request; row: Row; position?: number; teamSize: number; qs: string; periodLabel: string; from?: string;
}) {
  const [leads, setLeads] = useState<LeadRecord[] | null>(null);
  const [memberList, setMemberList] = useState<Member[] | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    setMemberList(null); setMemberError(null);
    const period = from ? `&from=${encodeURIComponent(from)}` : "";
    request<{ items: Member[] }>(`/api/v1/admin/memberships?enrolledBy=${encodeURIComponent(row.username)}&size=200${period}`)
      .then((p) => setMemberList(p.items), (e: Error) => setMemberError(e.message || "Could not load memberships."));
  }, [request, from, row.username]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLeads(null);
    const sep = qs ? "&" : "?";
    request<LeadRecord[]>(`/api/v1/sales/leads${qs}${sep}assignedTo=${encodeURIComponent(row.username)}`)
      .then(setLeads, (e: Error) => setError(e.message || "Could not load this executive's leads."));
  }, [request, qs, row.username]);

  const q = search.trim().toLowerCase();
  const shown = (leads ?? []).filter((l) => (status === "ALL" || l.status === status)
    && (!q || [l.publicReference, l.name, l.email, l.phone, l.roomCategory].some((v) => v?.toLowerCase().includes(q))));
  const s = row.s;

  return (
    <div className="perf-detail">
      <button type="button" className="btn-outline perf-back" onClick={() => navigate("employees", "performance")}>
        ← All executives
      </button>

      <div className="perf-detail-head">
        <div className="row-avatar perf-detail-avatar">{initials(row.name)}</div>
        <div>
          <h2>{row.name}</h2>
          <small>@{row.username}{row.email ? ` · ${row.email}` : ""}{position ? ` · Rank ${position} of ${teamSize}` : ""}</small>
        </div>
      </div>

      <div className="perf-kpis">
        <Kpi label="Attended" value={s.attendedCount} hint={periodLabel} />
        <Kpi label="In progress" value={s.inProgressCount} />
        <Kpi label="Converted" value={s.convertedCount} tone="good" />
        <Kpi label="Lost" value={s.lostCount} />
        <Kpi label="Conversion rate" value={s.attendedCount ? pct(s.conversionRate) : "—"} tone="good" />
        <Kpi label="Avg first response" value={formatMinutes(s.avgFirstResponseMinutes)} />
        <Kpi label="Memberships sold" value={row.m.activeCount} tone="good"
             hint={`${row.m.pendingCount} pending · ${row.m.rejectedCount} rejected`} />
        <Kpi label="Membership revenue" value={inr(row.m.verifiedAmount)} tone="good" hint="Verified payments" />
      </div>

      <div className="table-card perf-section">
        <div className="table-header-bar">
          <div className="table-title-group">
            <h2>Memberships brought in</h2>
            <span className="count-badge">{memberList?.length ?? 0}</span>
          </div>
        </div>
        {memberError ? (
          <p role="alert" className="perf-empty">{memberError}</p>
        ) : !memberList ? (
          <p className="perf-empty">Loading memberships…</p>
        ) : memberList.length === 0 ? (
          <p className="perf-empty">{row.name} has not registered any Gold Members in this period.</p>
        ) : (
          <div className="table-container">
            <table className="cards-on-phone" aria-label={`Memberships brought in by ${row.name}`}>
              <thead>
                <tr>
                  <th>Membership</th>
                  <th>Member</th>
                  <th>Registered</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {memberList.map((m) => (
                  <tr key={m.id}>
                    <td data-label="Membership"><code className="perf-ref">{m.membershipId}</code></td>
                    <td>
                      <div className="row-name">{m.firstName} {m.lastName}</div>
                      <div className="row-sub">{m.mobile}</div>
                    </td>
                    <td data-label="Registered" className="row-sub">{formatDateTime(m.createdAt)}</td>
                    <td data-label="Payment">
                      <div className="perf-money">{inr(m.payment.amount)}</div>
                      <div className="row-sub">{m.payment.type.replace("_", " ")} · {m.payment.status.toLowerCase()}</div>
                    </td>
                    <td data-label="Status">
                      <span className={`lead-pill ${m.status === "ACTIVE" ? "lead-converted" : m.status === "REJECTED" ? "lead-lost" : "lead-progress"}`}>
                        {MEMBER_STATUS[m.status] ?? m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title-group">
            <h2>Leads</h2>
            <span className="count-badge">{shown.length} of {leads?.length ?? 0}</span>
          </div>
          <div className="perf-filters">
            <div className="perf-periods" role="group" aria-label="Lead status">
              {["ALL", "IN_PROGRESS", "CONVERTED", "LOST"].map((st) => (
                <button key={st} type="button" className={status === st ? "active" : ""} aria-pressed={status === st}
                        onClick={() => setStatus(st)}>
                  {st === "ALL" ? "All" : STATUS[st].label}
                </button>
              ))}
            </div>
            <div className="search-input-wrapper">
              <input type="search" placeholder="Search guest, phone or reference…" value={search}
                     onChange={(e) => setSearch(e.target.value)} aria-label="Search leads" />
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="perf-empty">{error}</p>
        ) : !leads ? (
          <p className="perf-empty">Loading leads…</p>
        ) : leads.length === 0 ? (
          <p className="perf-empty">{row.name} has no leads in this period.</p>
        ) : shown.length === 0 ? (
          <p className="perf-empty">No leads match the filter.</p>
        ) : (
          <div className="table-container">
            <table className="cards-on-phone" aria-label={`Leads attended by ${row.name}`}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Guest</th>
                  <th>Stay</th>
                  <th>Status</th>
                  <th>Came in / claimed</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <code className="perf-ref">{l.publicReference}</code>
                      {l.priority === "HIGH" && <span className="perf-high">High priority</span>}
                    </td>
                    <td>
                      <div className="row-name">{l.name}</div>
                      <div className="row-sub"><a href={`tel:${l.phone}`}>{l.phone}</a></div>
                      <div className="row-sub"><a href={`mailto:${l.email}`}>{l.email}</a></div>
                    </td>
                    <td data-label="Stay">
                      <div>{l.roomCategory}</div>
                      <div className="row-sub">{formatDate(l.checkinDate)} → {formatDate(l.checkoutDate)} · {l.guestCount} {l.guestCount === 1 ? "guest" : "guests"}</div>
                    </td>
                    <td data-label="Status"><span className={`lead-pill ${STATUS[l.status]?.cls ?? "lead-new"}`}>{STATUS[l.status]?.label ?? l.status}</span></td>
                    <td data-label="Came in / claimed" className="row-sub">
                      <div>{formatDateTime(l.createdAt)}</div>
                      <div>{l.claimedAt ? `Claimed ${formatDateTime(l.claimedAt)}` : "Not claimed"}</div>
                    </td>
                    <td data-label="Notes" className="perf-notes">{l.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
