"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { RoomCategory, RoomFeatureIcon } from "./stay-cards";
import { getScene } from "./resort-assets";
import {
  ArrowRight, Bath, BedDouble, House, Laptop, Leaf, Lock, PawPrint, PoolWaves,
  Ruler, ShowerHead, Sofa, SpaLotus, Users, Utensils, Wifi,
} from "./icons";

/* Pieces shared by /stay and the room pages (unit 3.27). */

const FEATURE_ICONS: Record<RoomFeatureIcon, typeof BedDouble> = {
  bed: BedDouble, ruler: Ruler, shower: ShowerHead, bath: Bath, wifi: Wifi,
  desk: Laptop, sofa: Sofa, leaf: Leaf, home: House, lock: Lock, paw: PawPrint,
  pool: PoolWaves, spa: SpaLotus, users: Users, dining: Utensils,
};

/** "Timber Wellness Zone · Block 2" -> "Timber Wellness Zone". */
export const zoneName = (zone: string) => zone.split(" · ")[0];

/** A room as a card. With a fine pointer, moving across the photograph
 *  flips through the room's renders (Airbnb's scrub); on touch, a swipe does.
 *  Feedback motion seen many times a session, so the crossfade is short
 *  (150ms opacity) and nothing moves. */
export function RoomCard({ room, index = 0 }: { room: RoomCategory; index?: number }) {
  const images = room.images.slice(0, 5);
  const [shown, setShown] = useState(0);
  const start = useRef<number | null>(null);
  const wholeUnit = (room.taxNote ?? "").startsWith("Full Unit");

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.min(images.length - 1, Math.floor(((e.clientX - box.left) / box.width) * images.length));
    if (i !== shown) setShown(i);
  };
  const swipeStart = (e: React.PointerEvent) => { if (e.pointerType !== "mouse") start.current = e.clientX; };
  const swipeEnd = (e: React.PointerEvent) => {
    if (start.current === null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    if (Math.abs(dx) < 30) return;
    setShown((s) => (s + (dx < 0 ? 1 : -1) + images.length) % images.length);
  };

  return (
    <article className="rcard" style={{ "--i": index } as React.CSSProperties}>
      <div
        className="rcard-photos"
        onPointerMove={scrub}
        onPointerLeave={() => setShown(0)}
        onPointerDown={swipeStart}
        onPointerUp={swipeEnd}
      >
        {images.map((img, i) => (
          <Image
            key={img.sceneId}
            {...getScene(img.sceneId)}
            alt={i === 0 ? img.alt : ""}
            sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 31vw"
            className={i === shown ? "is-shown" : undefined}
            aria-hidden={i === 0 ? undefined : true}
          />
        ))}
        <span className="rcard-zone">{zoneName(room.zone)}</span>
        <span className="rcard-dots" aria-hidden="true">
          {images.map((img, i) => <i key={img.sceneId} className={i === shown ? "is-on" : undefined} />)}
        </span>
      </div>

      <div className="rcard-body">
        <h3 className="rcard-name">{room.title}</h3>
        <p className="rcard-guests">
          <Users size={15} /> {wholeUnit ? "10–12 guests, whole cottage" : `Up to ${room.maxGuests} guests`}
        </p>
        <ul className="rcard-features">
          {room.features.slice(0, 2).map((f) => {
            const Icon = FEATURE_ICONS[f.icon];
            return <li key={f.title}><Icon size={15} /> {f.title}</li>;
          })}
        </ul>
        <div className="rcard-foot">
          <p className="rcard-price">
            <span>From</span>
            <strong>{room.startingTariff}</strong>
            <span>{wholeUnit ? "a night, whole unit" : "a night"}</span>
          </p>
          <Link href={`/stay/${room.slug}`} className="rcard-cta">
            View room <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* What each meal plan includes, drawn as the three meals of the day. The
 * rules are the ERP's: EP room only, CP with breakfast, MAP breakfast plus
 * lunch or dinner, AP all meals. */
const PLANS: { code: string; name: string; meals: [boolean, boolean | "either", boolean | "either"] }[] = [
  { code: "EP", name: "Room only", meals: [false, false, false] },
  { code: "CP", name: "With breakfast", meals: [true, false, false] },
  { code: "MAP", name: "Breakfast + lunch or dinner", meals: [true, "either", "either"] },
  { code: "AP", name: "All meals", meals: [true, true, true] },
];
const MEALS = ["Breakfast", "Lunch", "Dinner"];

export function MealPlans({ plans }: { plans?: string[] }) {
  const offered = plans ? PLANS.filter((p) => plans.some((x) => x.startsWith(p.code))) : PLANS;
  return (
    <ol className="mplans">
      {offered.map((plan, pi) => (
        <li key={plan.code} style={{ "--i": pi } as React.CSSProperties}>
          <p className="mplans-code">{plan.code}</p>
          <p className="mplans-name">{plan.name}</p>
          <span className="mplans-meals">
            {plan.meals.map((m, i) => (
              <span key={MEALS[i]} className={`mplans-meal${m === true ? " is-in" : m === "either" ? " is-either" : ""}`}>
                <i aria-hidden="true" />
                {MEALS[i]}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ol>
  );
}
