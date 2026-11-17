"use client";

import { useSyncExternalStore } from "react";
import { portalApi, type GuestUser, type InquiryRecord, type PortalMembership } from "./portal-client";
import { membershipCategories } from "./membership-data";
import { accessToken, initAuth, profile, signOutKeycloak } from "./guest-auth";

/* Who is signed in on the website, shared by /profile, the membership page
 * and the header (unit 3.30).
 *
 * The only session is a REAL one (D-119…D-123, D-142): signed in with Keycloak
 * (gh-guests, PKCE; guest-auth.ts). If the account has a verified Gold
 * Membership the kind is "member" and `membership` is real (number, holder,
 * validity, enrolling executive); usage is 0 because the ERP does not record
 * redemptions yet. Without a membership the kind is "guest".
 *
 * The earlier browser-only sessions (membership-ID "sample" sign-in, sample
 * bookings, sample membership linking) were removed for production (D-142);
 * anything they left in localStorage is cleared on first load. */

export type SampleMembership = {
  membershipNo: string;
  holder: string;
  validTo: string;
  /** True for a verified Gold Membership from the ERP (not sample data). */
  real?: boolean;
  validFrom?: string;
  /** The Sales Executive who enrolled the member; mobile only if they share it. */
  executive?: { name: string; username: string; mobile: string | null };
  /** Per booklet part (membership-data.ts ids): how many vouchers / coupons
   *  are marked used. Sample figures, not ERP data. */
  used: Record<string, { vouchers: number; coupons: number }>;
};

export type Session = {
  kind: "guest" | "member";
  user: GuestUser;
  membership: SampleMembership | null;
  /** Signed in, but the membership service could not be reached: show "try again", not the non-member view. */
  membershipError?: boolean;
};

/** Keys the removed browser-only sessions used; cleared so old fake sign-ins never show (D-142). */
const LEGACY_KEYS = ["ghr_sample_membership", "ghr_session_kind"];
const EVENT = "ghr-session";

function clearLegacySessions() {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch { /* storage blocked: nothing stored */ }
  portalApi.logout();   // the old stored portal user
}

/* --- Real (Keycloak) session ------------------------------------------------
 * Loaded once per page: keycloak-js finishes a sign-in redirect or silently
 * checks the session, then the membership is fetched with the token. */

let real: Session | null = null;
let realStarted = false;

/** "2027-11-16T10:00:00Z" -> "2027-11-16" in resort time (IST). */
function istDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function toMembership(m: PortalMembership): SampleMembership {
  const used: SampleMembership["used"] = {};
  membershipCategories.forEach((c) => { used[c.id] = { vouchers: 0, coupons: 0 }; });
  return {
    membershipNo: m.membershipId,
    holder: `${m.firstName} ${m.lastName}`.trim(),
    validFrom: istDate(m.validFrom),
    validTo: istDate(m.validUntil),
    used,
    real: true,
    executive: m.enrolledBy,
  };
}

async function loadReal() {
  if (!(await initAuth())) return;
  const p = profile();
  const token = await accessToken();
  if (!p || !token) return;
  let membership: SampleMembership | null = null;
  let membershipError = false;
  // The account record (guest-service, also records this sign-in in guest_db, D-128) and the membership, together.
  const [account, found] = await Promise.all([
    portalApi.getMe(token).catch(() => null),
    portalApi.getMyMembership(token).then(
      (m) => m,
      () => { membershipError = true; return null; },   // unreachable: signed in, membership unknown
    ),
  ]);
  if (account?.status === "DISABLED") return;   // refused by the resort: stay signed out
  membership = found ? toMembership(found) : null;
  real = {
    kind: membership ? "member" : "guest",
    user: { guestId: p.sub, name: p.name || p.email, email: p.email, phone: "", token },
    membership,
    membershipError,
  };
  announce();
  // Arrived from the welcome email (or a sign-in started on the membership page): show the card.
  const url = new URL(window.location.href);
  if (url.searchParams.get("welcome") === "1") {
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url.pathname + url.search + "#your-card");
    setTimeout(() => document.getElementById("your-card")?.scrollIntoView({ behavior: "smooth" }), 300);
  }
}

/** Asks for the membership again after "We couldn't load your membership". */
export function retryMembership() {
  void loadReal();
}

/** Only a real (Keycloak) session counts as signed in. */
function read(): Session | null {
  return real;
}

function subscribe(callback: () => void) {
  if (!realStarted) {
    realStarted = true;
    clearLegacySessions();
    void loadReal();
  }
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

/** The signed-in session, or null. Always null on the server and during
 *  hydration, so the first paint matches the prerendered page. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

function announce() {
  window.dispatchEvent(new Event(EVENT));
}

export function signOut() {
  const wasReal = real !== null;
  real = null;
  clearLegacySessions();
  announce();
  // A real session also ends at Keycloak, then comes back to this page.
  if (wasReal) void signOutKeycloak(window.location.pathname);
}

/* --- Bookings -------------------------------------------------------------- */

export type Booking = InquiryRecord;

/** Booking requests split around today by check-out date. */
export function splitBookings(list: Booking[]) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = list.filter((b) => b.checkoutDate >= today).sort((a, b) => a.checkinDate.localeCompare(b.checkinDate));
  const past = list.filter((b) => b.checkoutDate < today).sort((a, b) => b.checkinDate.localeCompare(a.checkinDate));
  return { upcoming, past };
}
