// Calls the API gateway with the employee's access token (AUTHENTICATION.md §5 "React token and session handling").
import { config } from "./config";
import type { Session } from "./auth";

export class ForbiddenError extends Error {}
export class SessionEndedError extends Error {}

export interface ApiErrorBody {
  code: string;
  message: string;
  correlationId?: string;
}

export class ApiError extends Error {
  constructor(public status: number, public body: ApiErrorBody | null) {
    super(body?.message ?? `Request failed (${status})`);
  }
}

export function createApi(session: Session, fetchFn: typeof fetch = fetch) {
  async function send(path: string, init: RequestInit, token: string) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    // FormData (file uploads) must keep the browser's own multipart Content-Type with its boundary.
    if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetchFn(config.apiUrl + path, { ...init, headers });
  }

  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let token: string;
    try {
      token = await session.token();
    } catch {
      await session.login();
      throw new SessionEndedError();
    }
    let res = await send(path, init, token);
    if (res.status === 401) {
      // One refresh and retry; a second 401 means the session is over.
      try {
        res = await send(path, init, await session.refresh());
      } catch {
        await session.login();
        throw new SessionEndedError();
      }
      if (res.status === 401) {
        await session.login();
        throw new SessionEndedError();
      }
    }
    if (res.status === 403) throw new ForbiddenError();
    if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
    if (res.status === 204) return undefined as T;
    // Images (e.g. a payment screenshot) come back as a Blob; everything else is JSON.
    if ((res.headers.get("Content-Type") ?? "").startsWith("image/")) return (await res.blob()) as T;
    return (await res.json()) as T;
  };
}

export interface Me {
  employee: { id: string; firstName: string; lastName: string; email: string; username: string; jobRole: string; status: string } | null;
  roles: string[];
  permissions: string[];
  modules: string[];
}

export interface LeadRecord {
  id: string;
  publicReference: string;
  name: string;
  email: string;
  phone: string;
  checkinDate: string;
  checkoutDate: string;
  roomCategory: string;
  guestCount: number;
  notes?: string;
  status: "NEW" | "IN_PROGRESS" | "CONVERTED" | "LOST";
  priority: string;
  assignedTo?: string;
  claimedBy?: string;
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** One executive's lead performance in a period (lead-service GET /api/v1/sales/leads/summary, D-137). */
export interface ExecutiveLeadSummary {
  username: string;
  attendedCount: number;
  inProgressCount: number;
  convertedCount: number;
  lostCount: number;
  /** converted / attended, 0..1 */
  conversionRate: number;
  /** Average minutes from a lead arriving to the executive claiming it; null when unknown. */
  avgFirstResponseMinutes: number | null;
}

/** Memberships one executive brought in (access-service GET /api/v1/admin/memberships/summary, D-140). */
export interface ExecutiveMemberships {
  employeeId: string;
  username: string;
  name: string;
  enrolledCount: number;
  activeCount: number;
  pendingCount: number;
  rejectedCount: number;
  /** Verified payments only, rupees as a two-decimal string ("75000.00"). */
  verifiedAmount: string;
}

export interface MembershipSummary {
  executives: ExecutiveMemberships[];
  enrolledCount: number;
  activeCount: number;
  pendingCount: number;
  verifiedAmount: string;
}

export interface TeamLeadSummary {
  executives: ExecutiveLeadSummary[];
  /** New leads nobody has claimed yet. */
  unclaimedCount: number;
}
