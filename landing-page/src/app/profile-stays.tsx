"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import type { Booking } from "./guest-session";
import { roomTypes } from "./stay-data";
import { getScene } from "./resort-assets";
import { Sketch } from "./pencil";
import { ArrowRight, Users } from "./icons";

/* The guest's stays on /profile (unit 3.32), built for a phone first.
 *
 * - The next stay is the lead: the room's render, the dates as two calendar
 *   leaves, nights, guests, status and how many days away it is.
 * - Further upcoming stays are compact rows under it.
 * - Past stays are postcards in a row you swipe sideways (native scroll-snap,
 *   so it moves under the finger with the phone's own physics); on wide
 *   screens the row simply shows them all.
 * Motion: the lead card rises once; postcards need none (the swipe is the
 * motion). Reduced motion: nothing moves. */

const MONTH = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { month: "short" });
const DAY = (iso: string) => new Date(`${iso}T00:00:00`).getDate();
const WEEKDAY = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });
const MONTH_YEAR = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
const nights = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 86400000));

/** The ERP's request statuses in a guest's words. */
const STATUS: Record<string, string> = {
  NEW: "Request received",
  CONTACTED: "We are in touch",
  QUOTED: "Quote sent",
  CONFIRMED: "Confirmed",
  COMPLETED: "Stayed",
  CANCELLED: "Cancelled",
  LOST: "Closed",
};
const statusWord = (s: string) => STATUS[s] ?? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

/** The room this request is for, so the card can show its render. */
function roomFor(category: string) {
  const c = category.toLowerCase();
  return roomTypes.find((r) =>
    c.includes(r.title.toLowerCase()) || c.includes(r.inquiryName.toLowerCase()) ||
    r.title.toLowerCase().includes(c) || r.name.toLowerCase().includes(c));
}

/** Today as YYYY-MM-DD, known only in the browser. */
function useToday() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    // The visitor's date exists only in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Date().toISOString().slice(0, 10));
  }, []);
  return today;
}

export function NextStay({ b }: { b: Booking }) {
  const today = useToday();
  const room = roomFor(b.roomCategory);
  const n = nights(b.checkinDate, b.checkoutDate);
  const away = today ? Math.round((Date.parse(b.checkinDate) - Date.parse(today)) / 86400000) : null;
  const when = away === null ? "" : away > 1 ? `In ${away} days` : away === 1 ? "Tomorrow" : away === 0 ? "Today" : "You are here now";

  return (
    <article className="nstay">
      <div className="nstay-photo">
        {room ? (
          <Image {...getScene(room.images[0].sceneId)} alt={room.images[0].alt} sizes="(max-width: 900px) 100vw, 50vw" />
        ) : (
          <div className="nstay-drawing"><Sketch name="cottage" /></div>
        )}
        {when && <span className="nstay-when">{when}</span>}
      </div>
      <div className="nstay-body">
        <p className="nstay-status"><i />{statusWord(b.status)}</p>
        <h3 className="nstay-room">{b.roomCategory}</h3>
        <div className="nstay-dates" aria-label={`${WEEKDAY(b.checkinDate)} ${DAY(b.checkinDate)} ${MONTH(b.checkinDate)} to ${WEEKDAY(b.checkoutDate)} ${DAY(b.checkoutDate)} ${MONTH(b.checkoutDate)}`}>
          <span className="nstay-leaf"><small>{MONTH(b.checkinDate)}</small><strong>{DAY(b.checkinDate)}</strong><small>{WEEKDAY(b.checkinDate)}</small></span>
          <span className="nstay-span" aria-hidden="true"><i />{n} {n === 1 ? "night" : "nights"}<i /></span>
          <span className="nstay-leaf"><small>{MONTH(b.checkoutDate)}</small><strong>{DAY(b.checkoutDate)}</strong><small>{WEEKDAY(b.checkoutDate)}</small></span>
        </div>
        <p className="nstay-meta">
          <span><Users size={15} /> {b.guestCount} {b.guestCount === 1 ? "guest" : "guests"}</span>
          <span>{`Ref ${b.publicReference}`}</span>
        </p>
        {room && <Link href={`/stay/${room.slug}`} className="nstay-link">About this room <ArrowRight size={15} /></Link>}
      </div>
    </article>
  );
}

export function MoreUpcoming({ list }: { list: Booking[] }) {
  return (
    <ol className="mstay">
      {list.map((b) => {
        const n = nights(b.checkinDate, b.checkoutDate);
        return (
          <li key={b.id}>
            <span className="mstay-leaf"><small>{MONTH(b.checkinDate)}</small><strong>{DAY(b.checkinDate)}</strong></span>
            <span className="mstay-text">
              <strong>{b.roomCategory}</strong>
              <span>{n} {n === 1 ? "night" : "nights"} · {b.guestCount} {b.guestCount === 1 ? "guest" : "guests"} · {statusWord(b.status)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function PastPostcards({ list }: { list: Booking[] }) {
  return (
    <ol className="pcards" aria-label="Past stays, swipe for more">
      {list.map((b, i) => {
        const room = roomFor(b.roomCategory);
        const n = nights(b.checkinDate, b.checkoutDate);
        return (
          <li key={b.id} className="pcard" style={{ "--tilt": `${i % 2 ? 1.2 : -1.2}deg` } as CSSProperties}>
            <div className="pcard-photo">
              {room ? (
                <Image {...getScene(room.images[0].sceneId)} alt="" sizes="(max-width: 700px) 78vw, 320px" />
              ) : (
                <div className="nstay-drawing"><Sketch name="hills" /></div>
              )}
              <span className="pcard-stamp">{MONTH_YEAR(b.checkinDate)}</span>
            </div>
            <p className="pcard-room">{b.roomCategory}</p>
            <p className="pcard-meta">{n} {n === 1 ? "night" : "nights"} · {b.guestCount} {b.guestCount === 1 ? "guest" : "guests"}</p>
          </li>
        );
      })}
    </ol>
  );
}
