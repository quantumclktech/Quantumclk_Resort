import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Employees, type Employee } from "./Employees";
import { ApiError } from "./api";

afterEach(cleanup);

const ravi: Employee = { id: "e1", firstName: "Ravi", lastName: "Kumar", email: "ravi@example.test", username: "ravi.kumar",
  mobile: "+919876543210", jobRole: "SALES_EXECUTIVE", status: "INVITED", statusReason: null, identityLinked: true };
const stuck: Employee = { ...ravi, id: "e2", username: "stuck", status: "INVITE_EMAIL_FAILED", statusReason: "Invite email could not be sent" };
const pending: Employee = { ...ravi, id: "e4", username: "pending", status: "PENDING_PROVISIONING", statusReason: "Identity system unavailable; retrying automatically", identityLinked: false };

function fakeRequest(handlers: Record<string, (init?: RequestInit) => unknown>) {
  return vi.fn(async (path: string, init?: RequestInit) => {
    const h = Object.entries(handlers).find(([p]) => path.startsWith(p));
    if (!h) throw new Error("unexpected " + path);
    return h[1](init);
  }) as unknown as <T>(path: string, init?: RequestInit) => Promise<T>;
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("Employees", () => {
  it("lists employees with readable account status", async () => {
    render(<Employees request={fakeRequest({ "/api/v1/admin/employees": () => ({ items: [ravi, stuck, pending], page: 0, size: 100, total: 3 }) })} canManage />);
    expect(await screen.findByText("Invited")).toBeTruthy();
    expect(screen.getByText("Invite email failed — Invite email could not be sent")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Retry" })).toHaveLength(1);           // only the unlinked one
    expect(screen.getAllByRole("button", { name: "Resend invite" })).toHaveLength(2);   // linked + not finished
  });

  it("hides the add form and retry for read-only users (MANAGER)", async () => {
    render(<Employees request={fakeRequest({ "/api/v1/admin/employees": () => ({ items: [stuck], page: 0, size: 100, total: 1 }) })} canManage={false} />);
    await screen.findByText("stuck");
    expect(screen.queryByRole("form", { name: "Add employee" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("creates with an Idempotency-Key and shows the invite message", async () => {
    let sent: RequestInit | undefined;
    const request = fakeRequest({
      "/api/v1/admin/employees?": () => ({ items: [], page: 0, size: 100, total: 0 }),
      "/api/v1/admin/employees": (init) => { sent = init; return { ...ravi }; },
    });
    render(<Employees request={request} canManage />);
    fill("First name", "Ravi"); fill("Last name", "Kumar"); fill("Email", "ravi@example.test");
    fill("Username", "ravi.kumar"); fill("Mobile (e.g. +91 98765 43210)", "+91 98765 43210"); fill("PAN", "abcpe 1234-f");
    expect(screen.getByText("Valid PAN · saved as XXXXXX234F")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add employee" }));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("was invited");
    expect(new Headers(sent!.headers).get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.parse(sent!.body as string)).toMatchObject({ email: "ravi@example.test", jobRole: "SALES_EXECUTIVE", whatsappOptIn: false, pan: "ABCPE1234F" });
  });

  it("only creates Sales Executives: no role picker", async () => {
    render(<Employees request={fakeRequest({ "/api/v1/admin/employees?": () => ({ items: [], page: 0, size: 100, total: 0 }) })} canManage />);
    await screen.findByRole("form", { name: "Add employee" });
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText(/Only Sales Executive accounts can be created/)).toBeTruthy();
  });

  it("checks the PAN before sending: a company PAN is refused", async () => {
    const paths: string[] = [];
    const request = vi.fn(async (path: string) => { paths.push(path); return { items: [], page: 0, size: 100, total: 0 }; }) as unknown as
      <T>(path: string, init?: RequestInit) => Promise<T>;
    render(<Employees request={request} canManage />);
    fill("First name", "A"); fill("Last name", "B"); fill("Email", "a@b.test"); fill("Username", "ab1");
    fill("Mobile (e.g. +91 98765 43210)", "+91 98765 43210"); fill("PAN", "ABCCE1234F");
    expect(screen.getByText(/4th letter of a person's PAN is P/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add employee" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(paths.filter((p) => !p.includes("?"))).toHaveLength(0);   // nothing was POSTed
  });

  it("shows masked PAN in the roster", async () => {
    render(<Employees request={fakeRequest({ "/api/v1/admin/employees": () => ({ items: [{ ...ravi, panMasked: "XXXXXX234F" }], page: 0, size: 100, total: 1 }) })} canManage={false} />);
    expect(await screen.findByText(/PAN XXXXXX234F/)).toBeTruthy();
  });

  it("shows the server's field errors next to the inputs", async () => {
    const request = fakeRequest({
      "/api/v1/admin/employees?": () => ({ items: [], page: 0, size: 100, total: 0 }),
      "/api/v1/admin/employees": () => { throw new ApiError(400, { code: "VALIDATION_FAILED", message: "Some fields are invalid.", fields: { mobile: "international format" } } as never); },
    });
    render(<Employees request={request} canManage />);
    fill("First name", "A"); fill("Last name", "B"); fill("Email", "a@b.test"); fill("Username", "ab1"); fill("Mobile (e.g. +91 98765 43210)", "123"); fill("PAN", "ABCPE1234F");
    fireEvent.click(screen.getByRole("button", { name: "Add employee" }));
    expect(await screen.findByText("international format")).toBeTruthy();
  });
});

describe("Employees account actions", () => {
  const disabled: Employee = { ...ravi, id: "e3", username: "gone", status: "DISABLED" };

  it("deactivates with the reason the admin typed", async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const request = vi.fn(async (path: string, init?: RequestInit) => {
      calls.push([path, init]);
      return path.includes("?") ? { items: [ravi], page: 0, size: 100, total: 1 } : ravi;
    }) as unknown as <T>(path: string, init?: RequestInit) => Promise<T>;
    vi.spyOn(window, "prompt").mockReturnValue("Left the company");
    render(<Employees request={request} canManage />);
    fireEvent.click(await screen.findByRole("button", { name: "Deactivate" }));
    await screen.findByText("ravi.kumar");
    const [path, init] = calls.find(([p]) => p.endsWith("/status"))!;
    expect(path).toBe("/api/v1/admin/employees/e1/status");
    expect(init!.method).toBe("PATCH");
    expect(JSON.parse(init!.body as string)).toEqual({ active: false, reason: "Left the company" });
  });

  it("does nothing when the reason prompt is cancelled", async () => {
    const paths: string[] = [];
    const request = vi.fn(async (path: string) => { paths.push(path); return { items: [ravi], page: 0, size: 100, total: 1 }; }) as unknown as
      <T>(path: string, init?: RequestInit) => Promise<T>;
    vi.spyOn(window, "prompt").mockReturnValue(null);
    render(<Employees request={request} canManage />);
    fireEvent.click(await screen.findByRole("button", { name: "Deactivate" }));
    expect(paths.some((p) => p.endsWith("/status"))).toBe(false);
  });

  it("offers Activate for disabled employees and Resend for invited ones", async () => {
    render(<Employees request={fakeRequest({ "/api/v1/admin/employees": () => ({ items: [ravi, disabled], page: 0, size: 100, total: 2 }) })} canManage />);
    expect(await screen.findByRole("button", { name: "Activate" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resend invite" })).toBeTruthy();
  });

  it("never offers a role selector", async () => {
    render(<Employees request={fakeRequest({ "/api/v1/admin/employees": () => ({ items: [ravi], page: 0, size: 100, total: 1 }) })} canManage />);
    await screen.findByText("ravi.kumar");
    expect(screen.queryByLabelText("Role for ravi.kumar")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});

describe("Employees tabs (Sales Admin)", () => {
  it("shows Team Roster and Sales Performance tabs only for the Sales Admin", async () => {
    window.location.hash = "";
    const list = fakeRequest({ "/api/v1/admin/employees": () => ({ items: [ravi], page: 0, size: 100, total: 1 }) });
    render(<Employees request={list} canManage={false} />);
    await screen.findByText("ravi.kumar");
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByRole("button", { name: /View leads/ })).toBeNull();
    cleanup();
    render(<Employees request={list} canManage={false} showPerformance />);
    expect(await screen.findByRole("tab", { name: "Team Roster" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Sales Performance" })).toBeTruthy();
  });

  it("View leads on a Sales Executive row opens their performance page", async () => {
    window.location.hash = "";
    render(<Employees request={fakeRequest({ "/api/v1/admin/employees": () => ({ items: [ravi], page: 0, size: 100, total: 1 }) })}
                      canManage={false} showPerformance />);
    fireEvent.click(await screen.findByRole("button", { name: "View leads for Ravi Kumar" }));
    expect(window.location.hash).toBe("#employees/performance/ravi.kumar");
    window.location.hash = "";
  });
});
