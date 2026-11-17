"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSession } from "./guest-session";
import { membershipCategories } from "./membership-data";
import { ArrowDown, ArrowRight } from "./icons";

/* The membership page's hero copy (unit 3.31). Signed out it is the pitch it
 * always was (passed in as children). Signed in as a member it becomes theirs:
 * a welcome, what is left in their booklet, and where to go next — the
 * same card on the right, now engraved with their name. */

export function MemberHeroCopy({ children }: { children: ReactNode }) {
  const m = useSession()?.membership;
  if (!m) return <>{children}</>;

  const total = membershipCategories.reduce((s, c) => s + c.vouchersCount + c.couponsCount, 0);
  const used = Object.values(m.used).reduce((s, u) => s + u.vouchers + u.coupons, 0);
  const until = new Date(`${m.validTo}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mem-hero-copy mem-hero-copy--member" key="member">
      <p className="mem-kicker is-on-dark">Golden Hills Privilege Club · {m.membershipNo}</p>
      <h1 id="mem-title">Welcome back,<br />{m.holder.split(" ")[0]}</h1>
      <p className="mem-hero-left">
        <strong>{total - used}</strong>
        <span>of {total} privileges still yours<br />valid until {until}</span>
      </p>
      <div className="mem-hero-actions">
        <Link href="#your-card" className="mem-btn">See your booklet <ArrowDown size={16} /></Link>
        <Link href="/stay" className="mem-link">Plan a stay <ArrowRight size={15} /></Link>
      </div>
      <p className="mem-hero-sample">{m.real ? "Gold Member · verified by resort management · redemptions are recorded at the resort" : "Sample usage — the ERP does not record redemptions yet"}</p>
    </div>
  );
}

/** Sales sections (welcome box, "before you enrol" FAQ, the enrolment form)
 *  only make sense to someone who is not a member yet. Signed in with a
 *  membership, they are not rendered. A guest signed in without one still
 *  sees them. */
export function ProspectOnly({ children }: { children: ReactNode }) {
  const m = useSession()?.membership;
  return m ? null : <>{children}</>;
}

/** The ledger heading: a pitch for visitors, a reference for members. */
export function LedgerHeading() {
  const m = useSession()?.membership;
  return m ? (
    <>
      <p className="mem-kicker">Your privileges in full</p>
      <h2 id="ledger-title">Every voucher and coupon in your booklet</h2>
    </>
  ) : (
    <>
      <p className="mem-kicker">What is inside</p>
      <h2 id="ledger-title">Seven parts of the resort, one booklet</h2>
    </>
  );
}

/** The figures strip: the booklet's totals for visitors, the member's own
 *  standing once signed in. */
export function MemberFigures({ children }: { children: ReactNode }) {
  const m = useSession()?.membership;
  if (!m) return <>{children}</>;
  let v = 0, c = 0, vu = 0, cu = 0;
  for (const cat of membershipCategories) {
    v += cat.vouchersCount; c += cat.couponsCount;
    vu += m.used[cat.id]?.vouchers ?? 0; cu += m.used[cat.id]?.coupons ?? 0;
  }
  return (
    <dl className="wrap mem-figures" key="member">
      <div><dt>Vouchers left</dt><dd>{v - vu}</dd></div>
      <div><dt>Coupons left</dt><dd>{c - cu}</dd></div>
      <div><dt>Used so far</dt><dd>{vu + cu}</dd></div>
      <div><dt>Stay vouchers left</dt><dd>{(() => { const r = membershipCategories.find((cat) => cat.id === "rooms"); return r ? r.vouchersCount - (m.used[r.id]?.vouchers ?? 0) : 0; })()}</dd></div>
      <div><dt>Transferable</dt><dd>100%</dd></div>
    </dl>
  );
}
