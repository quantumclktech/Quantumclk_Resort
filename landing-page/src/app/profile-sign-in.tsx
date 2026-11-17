"use client";

import { useState } from "react";
import { signIn } from "./guest-auth";

/* Sign-in for /profile and the membership page (unit 3.30; D-123, D-142).
 *
 * The email only. "Sign in" opens the secure Golden Hills sign-in page
 * (Keycloak, realm gh-guests, PKCE) with the email filled in; the password is
 * typed there, never here. Back on /membership the member sees their real card
 * (guest-session.ts). Sign-in by membership ID is not offered until the ERP
 * supports it (the earlier preview with sample data was removed, D-142). */

export default function ProfileSignIn({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email you registered with.");
    setBusy(true);
    try {
      await signIn(email.trim(), "/membership?welcome=1");
    } catch {
      setError("We could not reach the sign-in service. Please try again in a moment.");
      setBusy(false);
    }
  }

  return (
    <div className={`psign${compact ? " is-compact" : ""}`}>
      <form className="psign-form" onSubmit={submit} noValidate>
        <label>
          <span>Email</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <p className="psign-note">Next, on the secure Golden Hills page, enter the password you set from your welcome email.</p>
        {error && <p className="psign-error" role="alert">{error}</p>}
        <button type="submit" className="psign-btn" disabled={busy}>{busy ? "Opening…" : "Sign in"}</button>
      </form>
    </div>
  );
}
