"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { GatheringVenue } from "./gatherings-data";
import { useMotionPreference } from "./motion-provider";
import { Sketch } from "./pencil";
import { MapPin, Users } from "./icons";

/* /gatherings — the six spaces as stacked panels, smallest to largest
 * (unit 3.24). Each panel pins under the header while the next slides over
 * it; the one underneath settles back a little. Beside the photograph, the
 * capacity is drawn as dots, one per ten guests, so 40 and 500 read as
 * different sizes before any number is read.
 *
 * Motion, per the animate skill:
 * - Gate: marketing page, read once (rare). Purposes: explanation (the dots
 *   fill to show scale) and spatial consistency (each space stacks on the
 *   last, the sequence growing).
 * - Tools: CSS sticky for the stack; Motion useScroll for the settle-back
 *   (computed function, transform + opacity only); an IntersectionObserver
 *   class for the photo uncover (clip-path) and the dot fill (opacity +
 *   transform, 12ms stagger, capped). Reduced motion and phones: a plain
 *   list, photos and dots simply shown. */

/** "20–40 Guests" -> 40, "300 Guests" -> 300. */
const seats = (capacity: string) => Math.max(...(capacity.match(/\d+/g) ?? ["0"]).map(Number));
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function VenueStack({ venues }: { venues: GatheringVenue[] }) {
  const ordered = [...venues].sort((a, b) => seats(a.capacity) - seats(b.capacity));
  const reduced = useMotionPreference();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    // Stacked on phones and tablets too (unit 3.32); only screens too short
    // for a panel (phones turned sideways) get the plain list.
    const media = window.matchMedia("(min-height: 560px)");
    // A browser-only layout fact.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWide(media.matches);
    const onChange = () => setWide(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const stacked = wide && !reduced;

  return (
    <ol className={`vstack${stacked ? " is-stacked" : ""}`}>
      {ordered.map((venue, index) => (
        <VenuePanel
          key={venue.name}
          venue={venue}
          index={index}
          count={ordered.length}
          stacked={stacked}
          reduced={reduced}
        />
      ))}
    </ol>
  );
}

function VenuePanel({ venue, index, count, stacked, reduced }: {
  venue: GatheringVenue;
  index: number;
  count: number;
  stacked: boolean;
  reduced: boolean;
}) {
  const slot = useRef<HTMLLIElement>(null);
  const [shown, setShown] = useState(false);
  const { scrollYProgress } = useScroll({ target: slot, offset: ["start start", "end start"] });
  const last = index === count - 1;
  // Settle back as the next panel slides over; the last one stays put.
  const scale = useTransform(() => (last ? 1 : 1 - 0.06 * clamp01(scrollYProgress.get())));
  const dim = useTransform(() => (last ? 1 : 1 - 0.35 * clamp01(scrollYProgress.get())));

  useEffect(() => {
    const el = slot.current;
    if (!el) return;
    if (reduced || !("IntersectionObserver" in window)) {
      // Nothing to wait for: show the photo and the full meter at once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  const guests = seats(venue.capacity);
  const dots = Math.ceil(guests / 10);
  const isStock = venue.image.includes("/amenities/");

  return (
    <li ref={slot} className="vslot" style={{ zIndex: index + 1 }}>
      <motion.article
        className={`vpanel${shown ? " is-in" : ""}${guests >= 300 ? " is-grand" : ""}`}
        style={stacked ? { scale, opacity: dim } : undefined}
        aria-labelledby={`venue-${index}`}
      >
        <div className="vpanel-shot">
          {isStock ? (
            // The lawn's photo is stock, not this resort (Q-020): drawn instead.
            <div className="vpanel-drawing"><Sketch name="banquet" label={`Pencil drawing for ${venue.name}`} /></div>
          ) : (
            <Image src={venue.image} alt={venue.imageAlt} fill sizes="(max-width: 900px) 100vw, 60vw" />
          )}
          <span className="vpanel-type">{venue.venueType}</span>
        </div>

        <div className="vpanel-text">
          <p className="vpanel-count">
            <span className="vpanel-num">{String(index + 1).padStart(2, "0")}</span>
            <span>of {String(count).padStart(2, "0")}</span>
          </p>
          <p className="vpanel-cap">
            <strong>{venue.capacity.replace(/\s*Guests?/i, "")}</strong>
            <span>guests</span>
          </p>
          <ol className="vmeter" aria-label={`Up to ${guests} guests, one dot per ten`}>
            {Array.from({ length: dots }, (_, i) => (
              <li key={i} style={{ transitionDelay: `${Math.min(i * 12, 600)}ms` }} />
            ))}
          </ol>
          <h2 id={`venue-${index}`} className="vpanel-name">{venue.name}</h2>
          <p className="vpanel-for"><Users size={14} /> {venue.idealFor} <MapPin size={14} /> {venue.tag}</p>
          <details className="vpanel-more">
            <summary>What is included</summary>
            <ul>{[...venue.inclusions, ...venue.policyNotes].map((line) => <li key={line}>{line}</li>)}</ul>
          </details>
        </div>
      </motion.article>
    </li>
  );
}
