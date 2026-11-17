"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DiningOutlet } from "./dining-cards";
import { hoursLabel, outletSlug, statusAt, useNow } from "./dining-hours";
import { getScene, impression } from "./resort-assets";
import {
  BuffetTray, Burger, ChevronLeft, ChevronRight, Coffee, Grill, Maximize, Thali, WineGlass, XIcon,
} from "./icons";
import { MenuButton } from "./dining-menu";

/* One section per outlet (unit 3.20). The photograph leads at more than half
 * the width and opens full screen; the text beside it is the outlet's name,
 * its hours in words, a live open/closed chip and three lines on the food.
 * The two bars sit on a dark band so the page runs from day into evening.
 *
 * Motion: each photograph is uncovered once as it scrolls into view
 * (clip-path, with the image settling from a slight zoom). The viewer fades
 * and scales from .97. Under reduced motion both are opacity only. */

const MARKS = { thali: Thali, grill: Grill, cocktail: WineGlass, burger: Burger, coffee: Coffee, buffet: BuffetTray };
const EVENING = new Set(["cocktail", "burger"]);

export default function DiningFeatures({ outlets }: { outlets: DiningOutlet[] }) {
  const now = useNow();
  const [shown, setShown] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<number | null>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      // Without the observer nothing would ever reveal, so show everything.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(new Set(outlets.map((_, i) => i)));
      return;
    }
    const observer = new IntersectionObserver((records) => {
      const arrived = records.filter((r) => r.isIntersecting).map((r) => Number((r.target as HTMLElement).dataset.index));
      if (!arrived.length) return;
      setShown((prev) => new Set([...prev, ...arrived]));
      for (const r of records) if (r.isIntersecting) observer.unobserve(r.target);
    }, { threshold: 0.2 });
    for (const el of sections.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [outlets]);

  return (
    <>
      {outlets.map((outlet, index) => {
        const Mark = MARKS[outlet.mark ?? "thali"];
        const status = now === null ? null : statusAt(outlet.openWindows, now);
        const evening = EVENING.has(outlet.mark ?? "");
        const flip = index % 2 === 1;
        return (
          <section
            key={outlet.name}
            id={outletSlug(outlet.name)}
            data-index={index}
            ref={(el) => { sections.current[index] = el; }}
            className={`dfeat${evening ? " is-evening" : ""}${flip ? " is-flip" : ""}${shown.has(index) ? " is-in" : ""}`}
            aria-labelledby={`${outletSlug(outlet.name)}-name`}
          >
            <div className="dfeat-inner wrap">
              <button
                type="button"
                className="dfeat-shot"
                ref={(el) => { triggers.current[index] = el; }}
                onClick={() => setOpen(index)}
                aria-label={`View ${outlet.name} full screen`}
              >
                <span className="dfeat-shot-clip">
                  <Image
                    {...getScene(outlet.sceneId)}
                    alt={outlet.imageAlt}
                    sizes="(max-width: 900px) 100vw, 56vw"
                  />
                </span>
                <span className="dfeat-view" aria-hidden="true"><Maximize size={16} /> Enlarge</span>
              </button>

              <div className="dfeat-text">
                <p className="dfeat-kicker">
                  <span className="dfeat-num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="dfeat-mark" aria-hidden="true"><Mark size={22} /></span>
                </p>
                <h2 id={`${outletSlug(outlet.name)}-name`} className="dfeat-name">{outlet.name}</h2>

                <p className="dfeat-when">
                  <span>{hoursLabel(outlet.openWindows)}</span>
                  {status && <span className={`dstatus${status.open ? " is-open" : ""}`}>{status.label}</span>}
                </p>

                <ul className="dfeat-dishes" aria-label="Known for">
                  {(outlet.dishes ?? []).map((dish) => <li key={dish}>{dish}</li>)}
                </ul>

                <MenuButton index={index} name={outlet.name} className="is-large" />
              </div>
            </div>
          </section>
        );
      })}

      {open !== null && (
        <Lightbox
          outlets={outlets}
          index={open}
          onIndex={setOpen}
          onClose={() => {
            const from = open;
            setOpen(null);
            triggers.current[from]?.focus();
          }}
        />
      )}
    </>
  );
}

function Lightbox({ outlets, index, onIndex, onClose }: {
  outlets: DiningOutlet[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const count = outlets.length;
  const go = useCallback((step: number) => onIndex((index + step + count) % count), [index, count, onIndex]);
  const outlet = outlets[index];

  useEffect(() => {
    closeBtn.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialog.current) {
        // Keep focus inside the viewer while it is open.
        const items = dialog.current.querySelectorAll<HTMLElement>("button");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <div
      className="dbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${outlet.name}, photo ${index + 1} of ${count}`}
      ref={dialog}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button type="button" className="dbox-btn dbox-close" onClick={onClose} ref={closeBtn} aria-label="Close">
        <XIcon size={20} />
      </button>

      <figure className="dbox-figure" key={outlet.name}>
        <div className="dbox-img">
          <Image {...getScene(outlet.sceneId)} alt={outlet.imageAlt} sizes="90vw" />
        </div>
        <figcaption>
          <span className="dbox-count">{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
          <strong>{outlet.name}</strong>
          <span>{outlet.imageLabel} · {impression}</span>
        </figcaption>
      </figure>

      <button type="button" className="dbox-btn dbox-prev" onClick={() => go(-1)} aria-label="Previous outlet">
        <ChevronLeft size={20} />
      </button>
      <button type="button" className="dbox-btn dbox-next" onClick={() => go(1)} aria-label="Next outlet">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
