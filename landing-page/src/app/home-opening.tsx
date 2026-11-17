"use client";

import Image from "next/image";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Scene } from "./resort-assets";
import { impression } from "./resort-assets";
import { useMotionPreference } from "./motion-provider";
import { Sketch, type SketchName } from "./pencil";
import { getTodayStr, addDays, getNightsBetween } from "./booking-dates";

/* The home opening (unit 3.22). A full-bleed render with the headline and a
 * booking bar, the way a hotel opens on film. Scrolling pulls the camera back:
 * the frame closes in to a framed landscape, then to a small portrait at the
 * centre, while the renders change underneath — a slideshow you drive by
 * scrolling instead of a video. A row of pencil sketches follows.
 *
 * Motion, per the animate skill:
 * - Gate: the first screen of a marketing page, seen once per visit (rare
 *   tier); purpose is explanation — the resort shown room by room — with
 *   spatial consistency, since one frame carries every image.
 * - Tool: Motion's useScroll (already the codebase's scroll engine). The frame
 *   is clipped (clip-path, the sanctioned fourth property) and the images only
 *   scale; nothing animates layout. The slide change is a CSS opacity
 *   transition, so fast scrolling retargets instead of restarting.
 * - Reduced motion: no pinned sequence; a still hero with the booking bar. */

export type OpeningSlide = {
  scene: Scene;
  label: string;
  alt: string;
  focalPoint?: string;
};

export type OpeningFeature = { sketch: SketchName; label: string };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Smoothstep: the camera eases in and settles rather than moving linearly. */
const ease = (t: number) => t * t * (3 - 2 * t);

/** The closing shot: a 3:4 portrait, centred a little above the middle to
 *  leave room for its caption. Returns its top edge, width and height. */
function portrait(W: number, H: number) {
  let ph = Math.min(H * 0.52, 460);
  let pw = ph * 0.75;
  if (pw > W * 0.64) { pw = W * 0.64; ph = pw / 0.75; }
  return { top: (H - ph) / 2 - 24, pw, ph };
}

export type OpeningIntro = { title: string; lead: string; credit: string };

export default function HomeOpening({ slides, features, intro }: {
  slides: OpeningSlide[];
  features: OpeningFeature[];
  intro: OpeningIntro;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const [active, setActive] = useState(0);
  const [atTop, setAtTop] = useState(true);
  const [past, setPast] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const width = useMotionValue(1440);
  const height = useMotionValue(900);
  const { scrollYProgress: p } = useScroll({ target: root, offset: ["start start", "end end"] });

  useEffect(() => {
    const measure = () => {
      width.set(window.innerWidth);
      height.set(document.documentElement.clientHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [width, height]);

  /* Frame insets in px for the three shots: full bleed, framed landscape,
   * centred portrait. Worked out from the viewport so the portrait keeps its
   * proportions on a phone as well as a desktop. */
  const clipPath = useTransform(() => {
    const t = p.get();
    const W = width.get();
    const H = height.get();
    const side1 = W < 700 ? 16 : Math.max(24, W * 0.12);
    const shot1 = [96, side1, 72, side1];
    const { top: top2, pw, ph } = portrait(W, H);
    const shot2 = [top2, (W - pw) / 2, H - top2 - ph, (W - pw) / 2];

    let inset: number[];
    if (t < 0.06) inset = [0, 0, 0, 0];
    else if (t < 0.34) {
      const k = ease(clamp01((t - 0.06) / 0.28));
      inset = shot1.map((v) => v * k);
    } else {
      const k = ease(clamp01((t - 0.34) / 0.26));
      inset = shot1.map((v, i) => lerp(v, shot2[i], k));
    }
    return `inset(${inset.map((v) => `${v.toFixed(1)}px`).join(" ")})`;
  });
  /* The images settle from a slight zoom as the frame closes in: the camera
   * pulling back. Scale only. */
  /* Computed functions rather than input/output ranges: Motion hands a plain
   * scroll -> opacity mapping to a browser ScrollTimeline, which tracks the
   * whole document instead of this pinned section and left the headline
   * visible at the end. A function cannot be offloaded, so it stays exact. */
  const imageScale = useTransform(() => 1.12 - 0.12 * clamp01(p.get() / 0.6));
  const overOpacity = useTransform(() => 1 - clamp01((p.get() - 0.03) / 0.06));
  const overY = useTransform(() => -24 * clamp01(p.get() / 0.09));
  const captionOpacity = useTransform(() => clamp01((p.get() - 0.52) / 0.1));
  /* The two sides drift upward at different speeds as the scroll continues:
   * depth, so the drawings read as a landscape around the picture. */
  const leftY = useTransform(() => 72 - 132 * clamp01((p.get() - 0.2) / 0.8));
  const rightY = useTransform(() => 120 - 96 * clamp01((p.get() - 0.2) / 0.8));
  const captionTop = useTransform(() => {
    const { top, ph } = portrait(width.get(), height.get());
    return top + ph + 16;
  });

  useMotionValueEvent(p, "change", (t) => {
    // One slide per stretch of the sequence; the last holds to the end.
    const next = Math.min(slides.length - 1, Math.floor((t / 0.88) * slides.length));
    setActive((prev) => (prev === next ? prev : next));
    const top = t < 0.05;
    setAtTop((prev) => (prev === top ? prev : top));
    // Once the fade is complete the overlay is hidden outright, so it cannot
    // reappear whatever the scroll-linked opacity does.
    const gone = t >= 0.09;
    setPast((prev) => (prev === gone ? prev : gone));
    // The side drawings draw in once the frame has closed enough to show
    // them, and un-draw if the visitor scrolls back up to the full bleed.
    const draw = t >= 0.3;
    setDrawn((prev) => (prev === draw ? prev : draw));
  });

  const slide = slides[active];

  return (
    <>
      <div ref={root} id="top" className="hop" data-reduced={reduced || undefined}>
        <div className="hop-stage">
          {!reduced && (
            <div className={`hop-sides${drawn ? " is-drawn" : ""}`} aria-hidden="true">
              <motion.div className="hop-side hop-side--left" style={{ y: leftY }}>
                <Sketch name="palm" className="sketch-manual hop-side-a" />
                <Sketch name="hills" className="sketch-manual hop-side-b" />
              </motion.div>
              <motion.div className="hop-side hop-side--right" style={{ y: rightY }}>
                <Sketch name="lantern" className="sketch-manual hop-side-a" />
                <Sketch name="tree" className="sketch-manual hop-side-b" />
              </motion.div>
            </div>
          )}
          <motion.div className="hop-frame" style={reduced ? undefined : { clipPath }}>
            <motion.div className="hop-slides" style={reduced ? undefined : { scale: imageScale }}>
              {slides.map((s, i) => (
                <div key={s.label} className={`hop-slide${i === active ? " is-active" : ""}`} aria-hidden={i !== active}>
                  <Image
                    src={s.scene.src}
                    alt={s.alt}
                    fill
                    preload={i === 0}
                    sizes="100vw"
                    style={{ objectFit: "cover", objectPosition: s.focalPoint ?? "center" }}
                  />
                </div>
              ))}
            </motion.div>
            <div className="hop-shade" aria-hidden="true" />
          </motion.div>

          <motion.div
            className={`hop-over${!reduced && past ? " is-gone" : ""}`}
            style={reduced ? undefined : { opacity: overOpacity, y: overY }}
            inert={!reduced && !atTop}
          >
            <div className="wrap hop-over-inner">
              <p className="hop-kicker">Golden Hills Resort · Biligi, Bagalkote</p>
              <h1 className="hop-title">Stay, dine and gather in northern Karnataka</h1>
              <BookingBar />
              <p className="hop-impression"><span className="hop-impression-label">{slide.label} · </span>{impression}</p>
            </div>
          </motion.div>

          <motion.p className="hop-caption" style={reduced ? { display: "none" } : { opacity: captionOpacity, top: captionTop }} aria-live="polite">
            <span className="hop-count">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
            <span>{slide.label}</span>
          </motion.p>
        </div>
      </div>

      <section id="story" className="hop-intro wrap" aria-labelledby="story-title" tabIndex={-1}>
        <div className="hop-statement">
          <p className="hop-statement-kicker">Golden Hills Resort · Biligi, Bagalkote</p>
          <h2 id="story-title">{intro.title}</h2>
          <p className="hop-statement-lead">{intro.lead}</p>
          <p className="hop-statement-credit">{intro.credit}</p>
        </div>
        <ul aria-label="At the resort">
          {features.map((f) => (
            <li key={f.label}>
              <Sketch name={f.sketch} />
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* Sends the dates to the booking form on /plan-ahead, which pre-fills from
 * these parameters. Enforces valid dates (check-in >= today, checkout > check-in). */
function BookingBar() {
  const [today, setToday] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState("2");
  const [dateError, setDateError] = useState<string | null>(null);

  // Initialize dates after client hydration to prevent SSR mismatch
  useEffect(() => {
    const t = getTodayStr();
    const ci = addDays(t, 1);
    const co = addDays(ci, 2);
    setToday(t);
    setCheckin(ci);
    setCheckout(co);
  }, []);

  const handleCheckinChange = (val: string) => {
    setDateError(null);
    setCheckin(val);
    if (!val) return;
    if (today && val < today) {
      setDateError("Check-in date cannot be in the past.");
      return;
    }
    // If checkout is on or before new checkin, automatically move checkout to 2 nights later
    if (checkout && val >= checkout) {
      setCheckout(addDays(val, 2));
    }
  };

  const handleCheckoutChange = (val: string) => {
    setDateError(null);
    setCheckout(val);
    if (checkin && val && val <= checkin) {
      setDateError("Check-out date must be after check-in.");
    }
  };

  const minCheckin = today || undefined;
  const minCheckout = checkin ? addDays(checkin, 1) : (today ? addDays(today, 1) : undefined);
  const nights = checkin && checkout ? getNightsBetween(checkin, checkout) : 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!checkin || !checkout) {
      e.preventDefault();
      setDateError("Please select both check-in and check-out dates.");
      return;
    }
    if (today && checkin < today) {
      e.preventDefault();
      setDateError("Check-in date cannot be in the past.");
      return;
    }
    if (checkout <= checkin) {
      e.preventDefault();
      setDateError("Check-out date must be at least 1 night after check-in.");
      return;
    }
  };

  return (
    <form className="hop-book" action="/plan-ahead#bookings" method="get" onSubmit={handleSubmit}>
      <label>
        <span>Check-in</span>
        <input
          type="date"
          name="checkin"
          required
          min={minCheckin}
          value={checkin}
          onChange={(e) => handleCheckinChange(e.target.value)}
        />
      </label>
      <label>
        <span>Check-out {nights > 0 ? `(${nights} ${nights === 1 ? "night" : "nights"})` : ""}</span>
        <input
          type="date"
          name="checkout"
          required
          min={minCheckout}
          value={checkout}
          onChange={(e) => handleCheckoutChange(e.target.value)}
        />
      </label>
      <label>
        <span>Guests</span>
        <select name="guests" value={guests} onChange={(e) => setGuests(e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
          ))}
        </select>
      </label>
      <button type="submit">Check availability</button>
      {dateError && (
        <p className="hop-book-error" role="alert">{dateError}</p>
      )}
    </form>
  );
}
