import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SalesPerformance, formatMinutes, periodStart, rank, topInMemberships, topPerformer, type Row } from "./SalesPerformance";
import type { ExecutiveLeadSummary, ExecutiveMemberships } from "./api";

afterEach(cleanup);
beforeEach(() => { window.location.hash = ""; });

const emp = (id: string, firstName: string, lastName: string, username: string, jobRole = "SALES_EXECUTIVE") => ({
  id, firstName, lastName, username, email: `${username}@example.com`, mobile: "+91 98765 00000", jobRole, status: "ACTIVE",
  statusReason: null, identityLinked: true,
});
const sum = (username: string, a: number, p: number, c: number, l: number, avg: number | null = null): ExecutiveLeadSummary => ({
  username, attendedCount: a, inProgressCount: p, convertedCount: c, lostCount: l, conversionRate: a ? c / a : 0, avgFirstResponseMinutes: avg,
});

const employees = { items: [emp("e1", "Rohan", "Sharma", "rohan"), emp("e2", "Anita", "Desai", "anita"), emp("e3", "Neha", "Iyer", "neha")], total: 3 };
const summary = { executives: [sum("rohan", 5, 2, 2, 1, 60), sum("anita", 8, 1, 6, 1, 20)], unclaimedCount: 3 };
const mem = (username: string, name: string, active: number, pending: number, amount: string): ExecutiveMemberships => ({
  employeeId: "id-" + username, username, name, enrolledCount: active + pending, activeCount: active, pendingCount: pending,
  rejectedCount: 0, verifiedAmount: amount,
});
const memberships = {
  executives: [mem("neha", "Neha Iyer", 3, 0, "75000.00"), mem("rohan", "Rohan Sharma", 1, 2, "25000.00")],
  enrolledCount: 6, activeCount: 4, pendingCount: 2, verifiedAmount: "100000.00",
};
const rohanMembers = [{
  id: "m1", membershipId: "GRH-LM-0105", firstName: "Kavya", lastName: "Rao", mobile: "+919845000001", status: "ACTIVE",
  createdAt: "2026-11-15T09:00:00Z", enrolledBy: { employeeId: "id-rohan", name: "Rohan Sharma", username: "rohan" },
  payment: { type: "SCAN_QR", amount: "25000.00", currency: "INR", status: "VERIFIED" },
}];
const rohanLeads = [
  { id: "l1", publicReference: "GH-INQ-2026-0011", name: "Rajesh Varma", email: "rajesh@example.com", phone: "+91 98450 11223",
    checkinDate: "2026-12-24", checkoutDate: "2026-12-27", roomCategory: "Poolside Villa", guestCount: 3, notes: "Christmas package",
    status: "IN_PROGRESS", priority: "HIGH", claimedBy: "rohan", claimedAt: "2026-11-15T10:00:00Z", createdAt: "2026-11-15T09:00:00Z", updatedAt: "2026-11-15T10:00:00Z" },
  { id: "l2", publicReference: "GH-INQ-2026-0012", name: "Pooja Hegde", email: "pooja@example.com", phone: "+91 99001 44556",
    checkinDate: "2026-12-10", checkoutDate: "2026-12-12", roomCategory: "Timber Cottage", guestCount: 2, notes: "Paid advance",
    status: "CONVERTED", priority: "MEDIUM", claimedBy: "rohan", claimedAt: "2026-11-14T10:00:00Z", createdAt: "2026-11-14T09:00:00Z", updatedAt: "2026-11-14T10:00:00Z" },
];

function fakeRequest() {
  const paths: string[] = [];
  const fn = vi.fn(async (path: string) => {
    paths.push(path);
    if (path.startsWith("/api/v1/admin/employees")) return employees;
    if (path.startsWith("/api/v1/admin/memberships/summary")) return memberships;
    if (path.startsWith("/api/v1/admin/memberships")) return { items: path.includes("enrolledBy=rohan") ? rohanMembers : [], total: 1 };
    if (path.startsWith("/api/v1/sales/leads/summary")) return summary;
    if (path.startsWith("/api/v1/sales/leads")) return path.includes("assignedTo=rohan") ? rohanLeads : [];
    throw new Error("unexpected " + path);
  }) as unknown as <T>(path: string, init?: RequestInit) => Promise<T>;
  return { fn, paths };
}

describe("ranking helpers", () => {
  const row = (username: string, s: ExecutiveLeadSummary): Row => ({ username, name: username, email: "", s, m: mem(username, username, 0, 0, "0.00") });

  it("ranks by converted, then conversion rate, then attended", () => {
    const r = rank([row("a", sum("a", 10, 0, 3, 7)), row("b", sum("b", 4, 0, 3, 1)), row("c", sum("c", 9, 0, 5, 4))]);
    expect(r.map((x) => x.username)).toEqual(["c", "b", "a"]);
  });

  it("needs a minimum of attended leads to be top performer", () => {
    expect(topPerformer(rank([row("lucky", sum("lucky", 1, 0, 1, 0)), row("steady", sum("steady", 6, 0, 1, 5))]))?.username).toBe("steady");
    expect(topPerformer([row("new", sum("new", 2, 0, 2, 0))])).toBeUndefined();
  });

  it("formats response times and period starts", () => {
    expect(formatMinutes(null)).toBe("—");
    expect(formatMinutes(42)).toBe("42 min");
    expect(formatMinutes(90)).toBe("1.5 h");
    const wed = new Date(2026, 10, 18, 15, 0);   // Wednesday 18 Nov 2026
    expect(periodStart("week", wed)).toEqual(new Date(2026, 10, 16));
    expect(periodStart("month", wed)).toEqual(new Date(2026, 10, 1));
    expect(periodStart("all", wed)).toBeNull();
  });
});

describe("SalesPerformance", () => {
  it("shows team KPIs, the top performer and a ranked leaderboard including executives with no leads", async () => {
    render(<SalesPerformance request={fakeRequest().fn} />);
    const table = await screen.findByRole("table", { name: "Sales executive leaderboard" });
    const names = within(table).getAllByRole("button", { name: /Sharma|Desai|Iyer/ }).map((b) => b.textContent);
    expect(names).toEqual(["Anita Desai", "Rohan Sharma", "Neha Iyer"]);
    expect(screen.getByRole("note", { name: "Top in leads" }).textContent).toContain("Anita Desai");
    expect(screen.getByText("Leads attended").parentElement!.textContent).toContain("13");
    expect(screen.getByText("Conversion rate").parentElement!.textContent).toContain("62%");   // 8 of 13
    expect(screen.getByText("Unclaimed leads").parentElement!.textContent).toContain("3");
  });

  it("shows memberships each executive brought in, and the top seller", async () => {
    render(<SalesPerformance request={fakeRequest().fn} />);
    await screen.findByRole("table", { name: "Sales executive leaderboard" });
    expect(screen.getByText("Memberships sold").parentElement!.textContent).toContain("4");
    expect(screen.getByText("Membership revenue").parentElement!.textContent).toContain("₹1,00,000");
    expect(screen.getByRole("note", { name: "Top in memberships" }).textContent).toContain("Neha Iyer");
    expect(screen.getByText("+2 pending")).toBeTruthy();   // Rohan: 1 sold, 2 awaiting verification

    fireEvent.click(screen.getByRole("button", { name: "Revenue" }));   // sort by verified money, highest first
    const table = screen.getByRole("table", { name: "Sales executive leaderboard" });
    expect(within(table).getAllByRole("button", { name: /Sharma|Desai|Iyer/ })[0].textContent).toBe("Neha Iyer");
  });

  it("ranks memberships by sold, then verified money", () => {
    const r = (u: string, m: ExecutiveMemberships): Row => ({ username: u, name: u, email: "", s: sum(u, 0, 0, 0, 0), m });
    expect(topInMemberships([r("a", mem("a", "A", 2, 0, "10000.00")), r("b", mem("b", "B", 2, 0, "50000.00"))])?.username).toBe("b");
    expect(topInMemberships([r("a", mem("a", "A", 0, 5, "0.00"))])).toBeUndefined();
  });

  it("asks for the chosen period", async () => {
    const { fn, paths } = fakeRequest();
    render(<SalesPerformance request={fn} />);
    await screen.findByRole("table", { name: "Sales executive leaderboard" });
    expect(paths.some((p) => p.startsWith("/api/v1/sales/leads/summary?from="))).toBe(true);   // default: this month
    fireEvent.click(screen.getByRole("button", { name: "All time" }));
    await screen.findByRole("table", { name: "Sales executive leaderboard" });
    expect(paths).toContain("/api/v1/sales/leads/summary");
  });

  it("clicking an executive opens their leads route", async () => {
    render(<SalesPerformance request={fakeRequest().fn} />);
    fireEvent.click(await screen.findByRole("button", { name: "Rohan Sharma" }));
    expect(window.location.hash).toBe("#employees/performance/rohan");
  });

  it("drills into one executive's leads with search and status filter", async () => {
    const { fn, paths } = fakeRequest();
    render(<SalesPerformance request={fn} selected="rohan" />);
    expect(await screen.findByText("Rajesh Varma")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Rohan Sharma" })).toBeTruthy();
    expect(screen.getByText(/Rank 2 of 3/)).toBeTruthy();
    expect(paths.some((p) => p.includes("assignedTo=rohan"))).toBe(true);
    expect(await screen.findByRole("table", { name: "Memberships brought in by Rohan Sharma" })).toBeTruthy();
    expect(screen.getByText("GRH-LM-0105")).toBeTruthy();
    expect(screen.getByText("Kavya Rao")).toBeTruthy();
    expect(paths.some((p) => p.startsWith("/api/v1/admin/memberships?enrolledBy=rohan"))).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Converted" }));
    expect(screen.queryByText("Rajesh Varma")).toBeNull();
    expect(screen.getByText("Pooja Hegde")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.change(screen.getByLabelText("Search leads"), { target: { value: "0011" } });
    expect(screen.getByText("Rajesh Varma")).toBeTruthy();
    expect(screen.queryByText("Pooja Hegde")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "← All executives" }));
    expect(window.location.hash).toBe("#employees/performance");
  });
});
