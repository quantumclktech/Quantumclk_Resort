"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getScene, impression } from "./resort-assets";
import { membershipCategories } from "./membership-data";
import { useMotionPreference } from "./motion-provider";
import { Sketch, type SketchName } from "./pencil";

/* One pencil drawing per part (unit 3.26). The tally redraws it each time
 * the part being read changes: the booklet turning to its next page. */
const DRAWINGS: Record<string, SketchName> = {
  rooms: "cottage",
  "day-outing": "pool",
  "fb-buffets": "thali",
  "a-la-carte": "dinner",
  celebrations: "banquet",
  beverages: "glasses",
  "spa-wellness": "lotus",
};

/* The ledger (unit 3.19). The seven parts of the membership read as a running
 * account: the tally on the left stays put and adds up as each entry passes,
 * so you watch 180 being reached instead of being told it. The tally is the
 * sum of the entries above and including the current one, so the figures are
 * always the real ones from membership-data.ts. */

export default function MembershipLedger() {
  const reduced = useMotionPreference();
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const entries = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (records) => {
        // The entry nearest the middle of the screen is the one being read.
        const visible = records.filter((r) => r.isIntersecting);
        if (!visible.length) return;
        const middle = window.innerHeight / 2;
        let best = -1, bestGap = Infinity;
        for (const r of visible) {
          const box = r.target.getBoundingClientRect();
          const gap = Math.abs(box.top + box.height / 2 - middle);
          if (gap < bestGap) { bestGap = gap; best = Number((r.target as HTMLElement).dataset.index); }
        }
        if (best >= 0) setActive(best);
        // Each entry is uncovered the first time it is reached, and stays.
        const reached = visible.map((r) => Number((r.target as HTMLElement).dataset.index));
        setSeen((prev) => (reached.every((i) => prev.has(i)) ? prev : new Set([...prev, ...reached])));
      },
      { threshold: 0.35, rootMargin: "-20% 0px -20% 0px" },
    );
    for (const el of entries.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const upto = membershipCategories.slice(0, active + 1);
  const vouchers = upto.reduce((sum, c) => sum + c.vouchersCount, 0);
  const coupons = upto.reduce((sum, c) => sum + c.couponsCount, 0);
  const current = membershipCategories[active];

  return (
    <div className="ledger">
      <aside className="ledger-tally" aria-hidden="true">
        <p className="ledger-tally-step">{String(active + 1).padStart(2, "0")} <i>of</i> {String(membershipCategories.length).padStart(2, "0")}</p>
        {/* Keyed on the part, so each change mounts a fresh drawing that
          * draws itself in (CSS animation). Under reduced motion it is
          * simply there. */}
        <Sketch key={current.id} name={DRAWINGS[current.id] ?? "hills"} className="sketch-manual ledger-tally-sketch" />
        <p className="ledger-tally-name">{current.shortName}</p>
        <dl className="ledger-tally-rows">
          <div><dt>Vouchers</dt><dd>{String(vouchers).padStart(3, "0")}</dd></div>
          <div><dt>Coupons</dt><dd>{String(coupons).padStart(3, "0")}</dd></div>
          <div className="ledger-tally-total"><dt>Running total</dt><dd>{vouchers + coupons}</dd></div>
        </dl>
        <div className="ledger-tally-bar">
          <span style={{ transform: `scaleX(${(vouchers + coupons) / 180})`, transition: reduced ? "none" : undefined }} />
        </div>
      </aside>

      <ol className="ledger-entries">
        {membershipCategories.map((category, index) => {
          const scene = getScene(category.sceneId);
          return (
            <li
              key={category.id}
              data-index={index}
              ref={(el) => { entries.current[index] = el; }}
              className={`ledger-entry${index === active ? " is-current" : ""}${seen.has(index) || reduced ? " is-seen" : ""}`}
            >
              <div className="ledger-entry-head">
                <span className="ledger-entry-no">{String(index + 1).padStart(2, "0")}</span>
                <h3>{category.name}</h3>
                <p className="ledger-entry-count">
                  {category.vouchersCount > 0 && <span>{category.vouchersCount} vouchers</span>}
                  {category.couponsCount > 0 && <span>{category.couponsCount} coupons</span>}
                </p>
              </div>

              <div className="ledger-entry-media">
                <Image {...scene} alt={`${category.name} concept`} sizes="(max-width: 900px) 100vw, 46vw" />
              </div>

              <ul className="ledger-entry-lines">
                {category.highlights.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </li>
          );
        })}
      </ol>
      <p className="ledger-note">{impression}</p>
    </div>
  );
}
