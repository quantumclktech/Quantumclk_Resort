"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { activationLoginUrl } from "../../guest-auth";

/* Reads the one-time token from the link and goes to Keycloak at once (a PKCE
 * sign-in carrying activation_token). The token is checked by Keycloak, not
 * here; a used or expired link simply shows the normal sign-in page there.
 * The page itself only says what is happening, or why it can't. */

const TOKEN = /^[0-9a-fA-F-]{36}\.[A-Za-z0-9_-]{43}$/;

export default function ActivateMember() {
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") ?? "";
    if (!TOKEN.test(t)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProblem("This link is incomplete. Open it again from your welcome email, or ask the resort to send a new one.");
      return;
    }
    activationLoginUrl(t, "/membership?welcome=1")
      .then((url) => window.location.replace(url))
      .catch(() => setProblem("We could not reach the sign-in service. Please try the link again in a moment."));
  }, []);

  return (
    <section className="prof-out wrap" aria-labelledby="act-title">
      <div className="prof-out-text">
        <p className="prof-kicker">Golden Hills Privilege Club</p>
        <h1 id="act-title">{problem ? "We couldn't open your membership" : "Opening your membership…"}</h1>
        {problem ? (
          <>
            <p role="alert">{problem}</p>
            <p><Link href="/membership#your-card" className="prof-link">Sign in with your email and password</Link></p>
          </>
        ) : (
          <p>Next, choose your password on the secure Golden Hills page. You will come straight back to your Gold card. Next time, sign in with your email and this password; this link works only once.</p>
        )}
      </div>
    </section>
  );
}
