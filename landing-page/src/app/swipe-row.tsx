"use client";

/* A row of items that swipes sideways on phones (native scroll-snap) and gets
 * previous / next buttons on wider screens. Used for the home page's room
 * and experience rows (unit 3.18). */

import { useRef, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "./icons";

export default function SwipeRow({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="swipe-row">
      <div className="swipe-row-track" ref={track} role="list" aria-label={label}>
        {children}
      </div>
      <div className="swipe-row-nav">
        <button type="button" onClick={() => move(-1)} aria-label={`Previous ${label.toLowerCase()}`}><ArrowLeft size={16} /></button>
        <button type="button" onClick={() => move(1)} aria-label={`Next ${label.toLowerCase()}`}><ArrowRight size={16} /></button>
      </div>
    </div>
  );
}
