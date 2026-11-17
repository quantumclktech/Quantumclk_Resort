import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Dashboard, SignIn } from "./App";
import type { Me } from "./api";

afterEach(cleanup);

const admin: Me = {
  employee: { id: "1", firstName: "Asha", lastName: "Rao", email: "a@example.test", username: "asha.rao", jobRole: "ADMIN", status: "ACTIVE" },
  roles: ["ADMIN"], permissions: ["employees.read"], modules: ["employees", "audit"],
};

describe("SignIn", () => {
  it("offers only the two role cards, never a password field", () => {
    const { container } = render(<SignIn onSignIn={() => {}} />);
    expect(container.querySelector("input[type=password]")).toBeNull();
    const titles = screen.getAllByRole("button").map((b) => b.querySelector("strong")?.textContent);
    expect(titles).toEqual(["Sales Admin", "Sales Executive"]);
  });

  it("starts the same Keycloak sign-in from every card", () => {
    const onSignIn = vi.fn();
    render(<SignIn onSignIn={onSignIn} />);
    fireEvent.click(screen.getByRole("button", { name: /Sales Executive/ }));
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
});

describe("Dashboard", () => {
  it("a Sales Admin has no Dashboard or Leads tab and opens on Employees", async () => {
    window.location.hash = "";
    const request = vi.fn(async () => ({ items: [], page: 0, size: 100, total: 0 })) as never;
    render(<Dashboard loadMe={() => Promise.resolve(admin)} onSignOut={() => {}} request={request} />);
    expect(await screen.findByRole("heading", { name: "Employees" })).toBeTruthy();
    expect(screen.getByText(/Sales Admin/)).toBeTruthy(); // the token role, in friendly words
    expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual(["Employees", "Audit log"]);
    expect(screen.getByRole("tab", { name: "Sales Performance" })).toBeTruthy();
    expect(screen.queryByText("Keycloak Verified")).toBeNull();
  });

  it("opens Sales Performance for an executive from the hash route", async () => {
    window.location.hash = "#employees/performance/rohan";
    const request = vi.fn(async (path: string) => {
      if (path.startsWith("/api/v1/admin/employees")) {
        return { items: [{ id: "2", firstName: "Rohan", lastName: "Sharma", username: "rohan", email: "rohan@example.com",
          mobile: "+919800000002", jobRole: "SALES_EXECUTIVE", status: "ACTIVE", statusReason: null, identityLinked: true }], total: 1 };
      }
      if (path.startsWith("/api/v1/sales/leads/summary")) {
        return { executives: [{ username: "rohan", attendedCount: 5, inProgressCount: 2, convertedCount: 2, lostCount: 1,
          conversionRate: 0.4, avgFirstResponseMinutes: 30 }], unclaimedCount: 0 };
      }
      return [];
    }) as never;
    render(<Dashboard loadMe={() => Promise.resolve(admin)} onSignOut={() => {}} request={request} />);
    expect(await screen.findByRole("heading", { name: "Rohan Sharma" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Sales Performance" }).getAttribute("aria-selected")).toBe("true");
    window.location.hash = "";
  });

  it("a Sales Executive gets only Memberships, named Dashboard and opened by default", async () => {
    const se: Me = {
      employee: { id: "2", firstName: "Sam", lastName: "One", email: "s@example.test", username: "sam.one", jobRole: "SALES_EXECUTIVE", status: "ACTIVE" },
      roles: ["SALES_EXECUTIVE"], permissions: ["memberships.register", "memberships.read_own"], modules: ["memberships"],
    };
    const request = vi.fn(async () => ({ membershipId: "GRH-LM-0105", provisional: true, items: [], total: 0 })) as never;
    render(<Dashboard loadMe={() => Promise.resolve(se)} onSignOut={() => {}} request={request} />);
    expect(await screen.findByRole("heading", { name: "Gold Membership" })).toBeTruthy();
    expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual(["Dashboard"]);
    expect(screen.queryByText(/Leads/)).toBeNull();
  });

  it("switches between light and dark and remembers it (D-141)", async () => {
    window.location.hash = "";
    const request = vi.fn(async () => ({ items: [], page: 0, size: 100, total: 0 })) as never;
    render(<Dashboard loadMe={() => Promise.resolve(admin)} onSignOut={() => {}} request={request} />);
    const toggle = await screen.findByRole("button", { name: "Toggle theme" });
    const start = document.documentElement.getAttribute("data-theme");
    fireEvent.click(toggle);
    const next = start === "dark" ? "light" : "dark";
    expect(document.documentElement.getAttribute("data-theme")).toBe(next);
    expect(localStorage.getItem("gh_erp_theme")).toBe(next);
  });

  it("a Manager still gets the dashboard; the Sales Admin never does (D-137, D-141)", async () => {
    window.location.hash = "";
    const manager: Me = {
      employee: { id: "3", firstName: "Mohan", lastName: "M", email: "m@example.test", username: "mohan", jobRole: "MANAGER", status: "ACTIVE" },
      roles: ["MANAGER"], permissions: ["employees.read", "memberships.read_all"], modules: ["dashboard", "employees", "memberships"],
    };
    const request = vi.fn(async () => ({ items: [], page: 0, size: 1, total: 2, pendingCount: 2 })) as never;
    render(<Dashboard loadMe={() => Promise.resolve(manager)} onSignOut={() => {}} request={request} />);
    expect(await screen.findByRole("heading", { name: "Welcome, Mohan M" })).toBeTruthy();
    expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual(["Dashboard", "Employees", "Memberships"]);
  });

  it("explains when the ERP record is missing", async () => {
    render(<Dashboard loadMe={() => Promise.resolve({ ...admin, employee: null })} onSignOut={() => {}} />);
    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("signs out", async () => {
    const onSignOut = vi.fn();
    render(<Dashboard loadMe={() => Promise.resolve(admin)} onSignOut={onSignOut} />);
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalled();
  });
});
