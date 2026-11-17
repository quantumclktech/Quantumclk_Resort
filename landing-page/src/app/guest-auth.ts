"use client";

import Keycloak from "keycloak-js";

/* Guest and member sign-in on the website (Gold Membership, D-119…D-123;
 * ERP_DEV/docs/02-architecture/identity/MEMBER-LOGIN.md).
 *
 * - Keycloak realm gh-guests, public client guest-web, Authorization Code +
 *   PKCE (S256). Passwords are typed only on Keycloak's own page; this site
 *   never sees them.
 * - Tokens live in memory only (never localStorage) and are refreshed by
 *   keycloak-js. A page load checks the Keycloak session silently
 *   (silent-check-sso.html), so a member stays signed in across pages.
 * - Keycloak's address: NEXT_PUBLIC_KEYCLOAK_URL if set; otherwise the site's
 *   own origin (the shared public URL proxies /realms to Keycloak), or
 *   http://localhost:8081 when the site runs on http://localhost:3000. */

const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "gh-guests";
const CLIENT = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT || "guest-web";

function keycloakUrl(): string {
  if (process.env.NEXT_PUBLIC_KEYCLOAK_URL) return process.env.NEXT_PUBLIC_KEYCLOAK_URL;
  const { origin, hostname, port } = window.location;
  return (hostname === "localhost" || hostname === "127.0.0.1") && port === "3000" ? "http://localhost:8081" : origin;
}

let kc: Keycloak | null = null;
let ready: Promise<boolean> | null = null;

function instance(): Keycloak {
  if (!kc) kc = new Keycloak({ url: keycloakUrl(), realm: REALM, clientId: CLIENT });
  return kc;
}

const later = <T,>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

/**
 * Initialises once per page: finishes a sign-in redirect, or silently checks for a Keycloak session.
 * keycloak-js waits for the silent check without a time limit; if the check page can't answer (it was refused
 * as a redirect before D-130, or a browser blocks the frame) the page would wait forever. So after 8 s we treat
 * the visitor as signed out; signing in still works (signIn does not depend on this check).
 */
export function initAuth(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!ready) {
    const k = instance();
    k.onTokenExpired = () => { k.updateToken(30).catch(() => { /* session ended; the next call shows signed out */ }); };
    const check = k.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    }).catch(() => false);   // Keycloak unreachable: behave as signed out
    ready = Promise.race([check, later(8000, false)]);
  }
  return ready ?? Promise.resolve(false);
}

export type AuthProfile = { sub: string; email: string; name: string; emailVerified: boolean };

export function profile(): AuthProfile | null {
  const t = kc?.tokenParsed as Record<string, unknown> | undefined;
  if (!kc?.authenticated || !t) return null;
  const name = [t.given_name, t.family_name].filter(Boolean).join(" ") || String(t.email ?? "");
  return { sub: String(t.sub), email: String(t.email ?? ""), name, emailVerified: t.email_verified === true };
}

/** A fresh access token (refreshed if it expires within 30 s), or null when signed out. */
export async function accessToken(): Promise<string | null> {
  if (!(await initAuth()) || !kc?.authenticated) return null;
  try {
    await kc.updateToken(30);
  } catch {
    return null;
  }
  return kc.token ?? null;
}

const back = (path: string) => `${window.location.origin}${path}`;

/** Throws when Keycloak can't be reached, so the page shows its own message instead of a browser or tunnel error page. */
async function ensureReachable() {
  const res = await fetch(`${keycloakUrl()}/realms/${REALM}/.well-known/openid-configuration`, { cache: "no-store" });
  if (!res.ok) throw new Error("The sign-in service is unavailable.");
}

/** Keycloak's sign-in page, with the email already filled in. Returns here (path) signed in. */
export async function signIn(email: string | undefined, returnPath: string) {
  await ensureReachable();
  // Only the start of init is needed (keycloak-js sets up its endpoints at once); never wait for the silent check (D-130).
  await Promise.race([initAuth(), later(1500, false)]);
  await instance().login({ loginHint: email || undefined, redirectUri: back(returnPath) });
}

/** Keycloak's registration page (email, name, password; email verification). */
export async function register(returnPath: string) {
  await ensureReachable();
  await Promise.race([initAuth(), later(1500, false)]);
  await instance().register({ redirectUri: back(returnPath) });
}

/** Ends the Keycloak session too, then comes back to returnPath. */
export async function signOutKeycloak(returnPath: string) {
  if (!kc?.authenticated) return;
  await kc.logout({ redirectUri: back(returnPath) });
}

/**
 * The welcome-email link (/member/activate?t=…): a normal PKCE sign-in plus the one-time activation token, which
 * Keycloak's gh-member-activation step accepts — the member sets a password once and comes back signed in.
 */
export async function activationLoginUrl(token: string, returnPath: string): Promise<string> {
  const k = instance();
  await k.init({ pkceMethod: "S256", checkLoginIframe: false });
  const url = await k.createLoginUrl({ redirectUri: back(returnPath) });
  return `${url}&activation_token=${encodeURIComponent(token)}`;
}
