"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { membershipCategories } from "./membership-data";
import type { SampleMembership } from "./guest-session";
import { Sketch, type SketchName } from "./pencil";

/* The member's booklet, drawn (unit 3.31). Shared by /profile and the
 * membership page.
 *
 * - One strip shows all 180 privileges split into the seven parts; what has
 *   been used is hatched, so the whole year reads at a glance.
 * - Each part is a page of the booklet: its drawing, how many are left (the
 *   number you came for, set large), and one stub per voucher and one dot per
 *   coupon. Used ones are torn away.
 *
 * Motion (explanation): when the booklet is first seen, the stubs are laid
 * down (opacity, 10ms apart, capped), then the used ones tear off — a small
 * drop and fade — so the reader watches "used" happen instead of decoding
 * it. Transitions, so nothing restarts. Reduced motion: drawn as it ends.
 * Figures are SAMPLE until the ERP records redemptions; the head says so. */

const DRAWINGS: Record<string, SketchName> = {
  rooms: "cottage",
  "day-outing": "pool",
  "fb-buffets": "thali",
  "a-la-carte": "dinner",
  celebrations: "banquet",
  beverages: "glasses",
  "spa-wellness": "lotus",
};

export default function BookletUsage({ membership }: { membership: SampleMembership }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      // Nothing to wait for; show the booklet as it ends.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const parts = membershipCategories.map((c) => {
    const u = membership.used[c.id] ?? { vouchers: 0, coupons: 0 };
    const size = c.vouchersCount + c.couponsCount;
    const used = u.vouchers + u.coupons;
    return { c, u, size, used, left: size - used };
  });
  const total = parts.reduce((s, p) => s + p.size, 0);
  const used = parts.reduce((s, p) => s + p.used, 0);

  return (
    <div ref={ref} className={`bkl${shown ? " is-shown" : ""}`}>
      <div className="bkl-sum">
        <p className="bkl-sum-big"><strong>{total - used}</strong> privileges left</p>
        <p className="bkl-sum-sub">{used} used of {total} · <span className="bkl-sample">{membership.real ? "redemptions are recorded at the resort; online tracking comes later" : "sample usage, the ERP does not record redemptions yet"}</span></p>
        <ol className="bkl-strip" aria-label="All privileges by part">
          {parts.map((p, i) => (
            <li key={p.c.id} style={{ flexGrow: p.size, "--i": i } as CSSProperties} title={`${p.c.shortName}: ${p.left} of ${p.size} left`}>
              <span className="bkl-strip-left" style={{ flexGrow: p.left }} />
              <span className="bkl-strip-used" style={{ flexGrow: p.used }} />
            </li>
          ))}
        </ol>
        <p className="bkl-legend"><i className="is-left" /> Left <i className="is-used" /> Used</p>
      </div>

      <ol className="bkl-pages">
        {parts.map((p, i) => (
          <li key={p.c.id} className={`bkl-page${p.left === 0 ? " is-spent" : ""}`} style={{ "--i": i } as CSSProperties}>
            <div className="bkl-page-top">
              <Sketch name={DRAWINGS[p.c.id] ?? "hills"} className="sketch-manual bkl-sketch" />
              <p className="bkl-left"><strong>{p.left}</strong><span>left</span></p>
            </div>
            <h3 className="bkl-name">{p.c.shortName}</h3>
            <p className="bkl-of">{p.used} used of {p.size}</p>

            {p.c.vouchersCount > 0 && (
              <div className="bkl-row">
                <span className="bkl-kind">Vouchers <b>{p.c.vouchersCount - p.u.vouchers}/{p.c.vouchersCount}</b></span>
                <span className="bkl-stubs" aria-label={`${p.u.vouchers} of ${p.c.vouchersCount} vouchers used`}>
                  {Array.from({ length: p.c.vouchersCount }, (_, k) => (
                    <i key={k} className={k >= p.c.vouchersCount - p.u.vouchers ? "is-used" : undefined} style={{ "--k": k } as CSSProperties} />
                  ))}
                </span>
              </div>
            )}
            {p.c.couponsCount > 0 && (
              <div className="bkl-row">
                <span className="bkl-kind">Coupons <b>{p.c.couponsCount - p.u.coupons}/{p.c.couponsCount}</b></span>
                <span className="bkl-dots" aria-label={`${p.u.coupons} of ${p.c.couponsCount} coupons used`}>
                  {Array.from({ length: p.c.couponsCount }, (_, k) => (
                    <i key={k} className={k >= p.c.couponsCount - p.u.coupons ? "is-used" : undefined} style={{ "--k": k } as CSSProperties} />
                  ))}
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
