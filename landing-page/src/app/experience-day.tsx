"use client";

import Image from "next/image";
import { motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ExperienceCategory } from "./experiences-data";
import { useMotionPreference } from "./motion-provider";
import { Sketch } from "./pencil";
import { Clock, MapPin, Users } from "./icons";

/* /experiences — "a day at Golden Hills" (unit 3.23). The seven experiences
 * in the order they happen, on a track that moves sideways as the page
 * scrolls down. A drawn sun crosses the bar above from Day to Evening and the
 * ground darkens behind the cards as the evening ones arrive.
 *
 * Motion, per the animate skill:
 * - Gate: a marketing page read once (rare tier). Purpose is explanation —
 *   the track and the sky together show the experiences as one day.
 * - Tool: Motion's useScroll, values computed in functions (a plain range
 *   mapping is offloaded to a document ScrollTimeline and drifts; see the
 *   home opening). Properties: transform on the track and the sun, opacity
 *   on the night layer. Nothing animates layout.
 * - Pinned only on wide screens with a fine layout; phones and reduced motion
 *   get the same cards as a plain vertical list. */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const END_BUFFER = 180; // px of vertical scroll buffer after sideways motion completes
const PHASES = [
  { key: "day", label: "Day" },
  { key: "sunset", label: "Sunset" },
  { key: "evening", label: "Evening" },
] as const;

export default function ExperienceDay({ experiences }: { experiences: ExperienceCategory[] }) {
  const items = [...experiences].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const reduced = useMotionPreference();
  const [wide, setWide] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const distance = useMotionValue(0);
  const barWidth = useMotionValue(0);
  const bar = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: root, offset: ["start start", "end end"] });
  const pinned = wide && !reduced;

  useEffect(() => {
    // Pinned on phones and tablets too (unit 3.32): vertical touch scroll
    // drives the sideways track exactly as a wheel does. Only screens too
    // short to hold a card (phones turned sideways) get the plain list.
    const media = window.matchMedia("(min-height: 560px)");
    // Layout facts that exist only in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWide(media.matches);
    const onChange = () => setWide(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const measure = () => {
      const el = track.current;
      if (!el) return;
      const travel = Math.max(0, el.scrollWidth - window.innerWidth + 48);
      distance.set(travel);
      barWidth.set(bar.current?.offsetWidth ?? 0);
      // Vertical room equals sideways travel plus buffer to hold final card
      setHeight(travel + window.innerHeight + END_BUFFER);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pinned, distance, barWidth]);

  // Normalized progress that completes sideways travel before unpinning
  const activeP = useTransform(() => {
    const travel = distance.get();
    if (travel <= 0) return p.get();
    const total = travel + END_BUFFER;
    return Math.min(1, (p.get() * total) / travel);
  });

  const x = useTransform(() => -distance.get() * activeP.get());
  /* Day -> sunset -> night as two layers: a warm sand that comes in through
   * the sundowner, then the forest night over it. Forest straight over paper
   * passes through a flat grey-green halfway. */
  const sunset = useTransform(() => clamp01((activeP.get() - 0.22) / 0.2));
  const night = useTransform(() => clamp01((activeP.get() - 0.5) / 0.3));
  const sunX = useTransform(() => Math.max(0, barWidth.get() - 28) * activeP.get());
  const sunY = useTransform(() => -Math.sin(Math.PI * activeP.get()) * 10);
  const sunOpacity = useTransform(() => 1 - clamp01((activeP.get() - 0.62) / 0.12));
  const moonOpacity = useTransform(() => clamp01((activeP.get() - 0.66) / 0.12));

  return (
    <section
      ref={root}
      className={`xday${pinned ? " is-pinned" : ""}`}
      style={pinned && height ? { height } : undefined}
      aria-label="Experiences through the day"
    >
      <div className="xday-stage">
        {pinned && <motion.div className="xday-sunset" style={{ opacity: sunset }} aria-hidden="true" />}
        {pinned && <motion.div className="xday-night" style={{ opacity: night }} aria-hidden="true" />}

        {pinned && (
          <div className="xday-bar wrap" aria-hidden="true">
            <div className="xday-bar-track" ref={bar}>
              {PHASES.map((phase) => <span key={phase.key}>{phase.label}</span>)}
              <motion.span className="xday-sun" style={{ x: sunX, y: sunY }}>
                <motion.svg viewBox="0 0 24 24" style={{ opacity: sunOpacity }}>
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
                </motion.svg>
                <motion.svg viewBox="0 0 24 24" style={{ opacity: moonOpacity }}>
                  <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
                </motion.svg>
              </motion.span>
            </div>
          </div>
        )}

        <motion.ol ref={track} className="xday-track" style={pinned ? { x } : undefined}>
          {items.map((item, index) => (
            <li key={item.name} className={`xcard xcard--${item.phase ?? "day"}`}>
              <p className="xcard-when">
                <span className="xcard-num">{String(index + 1).padStart(2, "0")}</span>
                {item.when}
              </p>
              <div className={`xcard-visual${item.sketch ? " is-drawing" : ""}`}>
                {item.sketch ? (
                  <Sketch name={item.sketch} label={`Pencil drawing for ${item.name}`} />
                ) : (
                  <Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 900px) 92vw, 440px" />
                )}
              </div>
              <h2 className="xcard-name">{item.name}</h2>
              <ul className="xcard-meta">
                <li><Users size={14} /> {item.idealFor}</li>
                <li><Clock size={14} /> {item.duration}</li>
                <li><MapPin size={14} /> {item.venue}</li>
              </ul>
              <details className="xcard-more">
                <summary>What is included</summary>
                <ul>{item.inclusions.map((line) => <li key={line}>{line}</li>)}</ul>
              </details>
            </li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
