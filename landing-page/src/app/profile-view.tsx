"use client";

import Link from "next/link";
import { retryMembership, signOut, useSession } from "./guest-session";
import ProfileSignIn from "./profile-sign-in";
import BookletUsage from "./booklet-usage";
import MemberExtras from "./member-extras";
import { Sketch } from "./pencil";
import { ArrowRight } from "./icons";

/* /profile (unit 3.30; D-142): the signed-in member's card and booklet.
 * Stays are not listed yet: the ERP has no online booking or guest booking
 * history (increment 2), so the page says so instead of calling a missing
 * endpoint. No sample data is shown. */

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function ProfileView() {
  const session = useSession();
  if (!session) {
    return (
      <section className="prof-out wrap" aria-labelledby="prof-title">
        <div className="prof-out-text">
          <p className="prof-kicker">Members’ sign in</p>
          <h1 id="prof-title">Your card, your stays, your booklet</h1>
          <p>Sign in with your email to see your Gold card and what is left in your booklet.</p>
          <Sketch name="cottage" className="prof-out-sketch" />
        </div>
        <ProfileSignIn />
      </section>
    );
  }

  const first = session.user.name.split(" ")[0];
  const membership = session.membership;

  return (
    <div className="prof wrap">
      <header className="prof-head">
        <div>
          <p className="prof-kicker">Your profile</p>
          <h1>Hello, {first}</h1>
        </div>
        <button type="button" className="prof-out-btn" onClick={signOut}>Sign out</button>
      </header>

      <section className="prof-sec" aria-labelledby="prof-up">
        <h2 id="prof-up">Your stays</h2>
        <div className="prof-empty-card">
          <Sketch name="hills" />
          <p>Online booking is not open yet, so stays booked with the resort are not listed here.</p>
          <Link href="/stay" className="prof-link">See the rooms <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="prof-sec" aria-labelledby="prof-mem">
        <h2 id="prof-mem">Membership</h2>
        {membership ? (
          <>
            <p className="prof-mem-line">
              {membership.membershipNo} · valid until {fmt(membership.validTo)}
            </p>
            {membership.real && <MemberExtras membership={membership} />}
            <BookletUsage membership={membership} />
            <Link href="/membership#your-card" className="prof-link">See your card <ArrowRight size={15} /></Link>
          </>
        ) : session.membershipError ? (
          <>
            <p>We could not load your membership just now.</p>
            <button type="button" className="prof-link" onClick={retryMembership}>Try again <ArrowRight size={15} /></button>
          </>
        ) : (
          <>
            <p>This account is not linked to a Gold Membership. Members are registered at the resort by our team.</p>
            <Link href="/membership#inquire" className="prof-link">Become a member <ArrowRight size={15} /></Link>
          </>
        )}
      </section>
    </div>
  );
}
