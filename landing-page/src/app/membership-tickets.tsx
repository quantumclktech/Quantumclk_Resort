"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getScene } from "./resort-assets";
import { membershipCategories } from "./membership-data";
import { useMotionPreference } from "./motion-provider";

/* "What is inside" as a booklet of tear-off tickets (unit 3.25). The seven
 * parts of the membership are dealt from a single pile onto the table when
 * the section is reached, and a bar above shows how the 180 privileges split
 * between them, filling as each ticket lands. Each ticket turns over to show
 * the privileges it holds — the small print lives on the back.
 *
 * Motion, per the animate skill:
 * - Deal: rare (once per visit); purpose spatial consistency — one booklet
 *   becoming seven parts. Each ticket starts at the pile (offset measured
 *   from the real layout, set on the ticket itself) and transitions to its
 *   place: transform only, var(--ease-out), 700ms, 80ms stagger.
 * - Bar: explanation; segments scale in on X, in step with the deal.
 * - Turn over: occasional, user-triggered; state indication. A rotateY
 *   transition (interruptible), 450ms ease-in-out since it moves on screen.
 * - Reduced motion: no deal, bar shown full; turning over is a crossfade. */

const TOTAL = membershipCategories.reduce((sum, c) => sum + c.vouchersCount + c.couponsCount, 0);
const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function MembershipTickets() {
  const reduced = useMotionPreference();
  const table = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const [piles, setPiles] = useState<string[] | null>(null);
  const [dealt, setDealt] = useState(false);
  const [turned, setTurned] = useState<number | null>(null);

  // Where the pile is, relative to each ticket's place on the table.
  useIsoLayout(() => {
    // Phones lay the tickets out as a swipe row; dealing across it would
    // fly cards in from off-screen, so they are simply placed.
    if (reduced || window.innerWidth <= 600) return;
    const box = table.current?.getBoundingClientRect();
    if (!box) return;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    // Measured once from the real layout before the first paint.
    setPiles(cards.current.map((el, i) => {
      if (!el) return "none";
      const r = el.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2);
      const dy = cy - (r.top + r.height / 2);
      const tilt = (i - 3) * 2.5;
      return `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px) rotate(${tilt}deg) scale(0.92)`;
    }));
  }, [reduced]);

  useEffect(() => {
    const el = table.current;
    if (!el) return;
    if (reduced || !("IntersectionObserver" in window)) {
      // Nothing to wait for: the tickets are simply laid out.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDealt(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setDealt(true); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div className={`tickets${dealt ? " is-dealt" : ""}`} ref={table}>
      <div className="tickets-total">
        <p><strong>{TOTAL}</strong> privileges, split seven ways</p>
        <ol className="tickets-bar" aria-hidden="true">
          {membershipCategories.map((c, i) => {
            const share = (c.vouchersCount + c.couponsCount) / TOTAL;
            return (
              <li key={c.id} style={{ flexGrow: share, transitionDelay: `${i * 80 + 200}ms` }}>
                <span>{String(i + 1).padStart(2, "0")}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <ol className="tickets-grid">
        {membershipCategories.map((c, i) => {
          const isTurned = turned === i;
          const pile = piles?.[i];
          return (
            <li
              key={c.id}
              ref={(el) => { cards.current[i] = el; }}
              className={`ticket${isTurned ? " is-turned" : ""}`}
              style={!reduced && pile && !dealt ? { transform: pile } : { transitionDelay: `${i * 80}ms` }}
            >
              <div className="ticket-inner">
                <article className="ticket-face ticket-front" aria-hidden={isTurned}>
                  <div className="ticket-photo">
                    <Image {...getScene(c.sceneId)} alt="" sizes="(max-width: 700px) 92vw, 300px" />
                    <span className="ticket-no">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="ticket-stub">
                    <h3>{c.name}</h3>
                    <p className="ticket-counts">
                      <span><strong>{c.vouchersCount}</strong> vouchers</span>
                      <span><strong>{c.couponsCount}</strong> coupons</span>
                    </p>
                  </div>
                </article>

                <article className="ticket-face ticket-back" aria-hidden={!isTurned}>
                  <p className="ticket-back-title">{c.shortName}</p>
                  <ul>
                    {c.privileges.map((pv) => (
                      <li key={pv.title}>
                        <strong>{pv.count}×</strong>
                        <span>{pv.title}{pv.badge ? <em>{pv.badge}</em> : null}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
              <button
                type="button"
                className="ticket-hit"
                aria-pressed={isTurned}
                aria-label={`${isTurned ? "Hide" : "Show"} the privileges in ${c.name}`}
                onClick={() => setTurned(isTurned ? null : i)}
              >
                <span aria-hidden="true">{isTurned ? "Turn back" : "See inside"}</span>
              </button>
            </li>
          );
        })}
        {/* The booklet's cover fills the eighth place: the whole in one card. */}
        <li className="ticket ticket-cover" aria-hidden="true" style={{ transitionDelay: `${membershipCategories.length * 80}ms` }}>
          <p className="ticket-cover-kicker">Golden Hills Privilege Club</p>
          <p className="ticket-cover-total"><strong>{TOTAL}</strong> privileges</p>
          <p className="ticket-cover-terms">12 months · fully transferable</p>
        </li>
      </ol>
    </div>
  );
}
