// API client for the Golden Hills public portal, through the API gateway.
// Same-origin by default ("/api/v1/portal"): on the shared public URL the proxy sends /api to the gateway, and on
// http://localhost:3000 next.config.ts rewrites /api to it. NEXT_PUBLIC_LEAD_API_URL can still override it.

export interface GuestUser {
  guestId: string;
  name: string;
  email: string;
  phone: string;
  token: string;
}

export interface InquirySubmission {
  name: string;
  email: string;
  phone: string;
  checkinDate: string;
  checkoutDate: string;
  roomCategory: string;
  guestCount: number;
  notes?: string;
}

export interface InquiryRecord {
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
  status: string;
  priority: string;
  claimedBy?: string;
  slaDeadline: string;
  slaBreached: boolean;
  createdAt: string;
}

export const PORTAL_API_BASE = process.env.NEXT_PUBLIC_LEAD_API_URL || "/api/v1/portal";

/** The signed-in member's own Gold Membership (access-service, api.md §3c). */
export interface PortalMembership {
  membershipId: string;
  firstName: string;
  lastName: string;
  tier: string;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  enrolledBy: { name: string; username: string; mobile: string | null };
}

export const portalApi = {
  getStoredUser(): GuestUser | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("ghr_portal_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user: GuestUser | null) {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem("ghr_portal_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("ghr_portal_user");
    }
  },

  async register(name: string, email: string, phone: string, password: string): Promise<GuestUser> {
    const res = await fetch(`${PORTAL_API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Registration failed. Please check your details.");
    }

    const data: GuestUser = await res.json();
    this.setStoredUser(data);
    return data;
  },

  async login(email: string, password: string): Promise<GuestUser> {
    const res = await fetch(`${PORTAL_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Invalid email or password.");
    }

    const data: GuestUser = await res.json();
    this.setStoredUser(data);
    return data;
  },

  logout() {
    this.setStoredUser(null);
  },

  async submitInquiry(payload: InquirySubmission, token?: string): Promise<InquiryRecord> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${PORTAL_API_BASE}/inquiries`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to submit inquiry. Please try again.");
    }

    return await res.json();
  },

  /** null = signed in but not a member (404 NO_MEMBERSHIP). */
  /** The guest's own account (guest-service). Also records the sign-in in guest_db (D-128). 403 = account disabled. */
  async getMe(token: string): Promise<{ status: string } | null> {
    const res = await fetch(`${PORTAL_API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 403) return { status: "DISABLED" };
    if (!res.ok) return null;
    return await res.json();
  },

  async getMyMembership(token: string): Promise<PortalMembership | null> {
    const res = await fetch(`${PORTAL_API_BASE}/membership/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to load your membership.");
    return await res.json();
  },

  async getMyInquiries(token: string): Promise<InquiryRecord[]> {
    const res = await fetch(`${PORTAL_API_BASE}/inquiries/me`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to load your inquiries.");
    }

    return await res.json();
  },
};
