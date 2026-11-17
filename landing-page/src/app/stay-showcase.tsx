"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { RoomCategory } from "./stay-cards";
import { getScene, impression } from "./resort-assets";
import { Sketch, type SketchName } from "./pencil";
import { MealPlans, RoomCard, zoneName } from "./stay-shared";

/* /stay (unit 3.27). Built for the moment someone chooses a room:
 * 1. A fanned deck of the six rooms that deals open on arrival (rare,
 *    delight + spatial: six ways in, one from each card).
 * 2. The resort drawn as three corners — the zones — which filter the rooms.
 * 3. Room cards that scrub through each room's renders under the pointer.
 * 4. The meal plans drawn as which meals of the day they cover.
 * Motion: CSS only. The deal is @starting-style (transform + opacity, 70ms
 * stagger); filtered cards rise in the same way; hovers gated to fine
 * pointers; reduced motion keeps the layout and drops the movement. */

const ZONES: { key: string; label: string; sketch: SketchName }[] = [
  { key: "Hotel Block 1", label: "Hotel Block 1", sketch: "hotel" },
  { key: "Timber Wellness Zone", label: "Timber Wellness Zone", sketch: "cottage" },
  { key: "Poolside Enclave", label: "Poolside Enclave", sketch: "pool" },
];

export default function StayShowcase({ rooms }: { rooms: RoomCategory[] }) {
  const [zone, setZone] = useState<string | null>(null);
  const shown = zone ? rooms.filter((r) => zoneName(r.zone) === zone) : rooms;
  const lowest = rooms.map((r) => r.startingTariff ?? "").sort((a, b) =>
    Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")))[0];

  return (
    <>
      {/* 1. Opening */}
      <section className="shero wrap" aria-labelledby="stay-title">
        <div className="shero-text">
          <p className="shero-kicker">Stay</p>
          <h1 id="stay-title">Six ways to wake up at Golden Hills</h1>
          <p className="shero-line">Rooms, a suite and cottages, from a queen room in Hotel Block 1 to a private cottage by the pool.</p>
          <dl className="shero-facts">
            <div><dt>Room types</dt><dd>{rooms.length}</dd></div>
            <div><dt>From, a night</dt><dd>{lowest}</dd></div>
            <div><dt>Zones</dt><dd>{ZONES.length}</dd></div>
          </dl>
          <a href="#rooms" className="shero-cta">Choose a room</a>
        </div>

        <ol className="sdeck" aria-label="The six room types">
          {rooms.map((room, i) => {
            const offset = i - (rooms.length - 1) / 2;
            return (
              <li
                key={room.slug}
                className="sdeck-card"
                style={{
                  "--x": `${offset * 13}%`,
                  "--y": `${Math.abs(offset) * 14}px`,
                  "--r": `${offset * 6}deg`,
                  "--d": `${i * 70}ms`,
                  zIndex: 10 - Math.round(Math.abs(offset) * 2),
                } as React.CSSProperties}
              >
                <Link href={`/stay/${room.slug}`}>
                  <Image {...getScene(room.images[0].sceneId)} alt={room.images[0].alt} sizes="260px" loading="eager" />
                  <span className="sdeck-label">
                    <strong>{room.title}</strong>
                    <span>{room.startingTariff}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="shero-note">{impression}</p>
      </section>

      {/* 2. The resort, drawn as its three corners; each one filters the rooms. */}
      <section className="smap wrap" aria-labelledby="smap-title">
        <div className="smap-head">
          <h2 id="smap-title">Three corners of the resort</h2>
          <p>Pick a corner to see the rooms in it</p>
        </div>
        <div className="smap-board" role="group" aria-label="Filter rooms by zone">
          <svg className="sketch smap-path" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
            <g filter="url(#pencil)">
              <path d="M40 50 C 220 10, 380 76, 600 40 S 960 8, 1160 46" pathLength={1} />
            </g>
          </svg>
          {ZONES.map((z, i) => {
            const count = rooms.filter((r) => zoneName(r.zone) === z.key).length;
            const on = zone === z.key;
            return (
              <button
                key={z.key}
                type="button"
                className={`smap-zone${on ? " is-on" : ""}`}
                aria-pressed={on}
                onClick={() => setZone(on ? null : z.key)}
                style={{ "--stop": i } as React.CSSProperties}
              >
                <Sketch name={z.sketch} />
                <span className="smap-label">{z.label}</span>
                <span className="smap-count">{count} {count === 1 ? "stay" : "stays"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. The rooms */}
      <section id="rooms" className="srooms wrap" aria-labelledby="srooms-title">
        <div className="srooms-head">
          <h2 id="srooms-title">{zone ?? "All stays"}</h2>
          <p aria-live="polite">{shown.length} of {rooms.length} · move across a photo to see more of the room</p>
          {zone && <button type="button" className="srooms-clear" onClick={() => setZone(null)}>Show all</button>}
        </div>
        <div className="srooms-grid" key={zone ?? "all"}>
          {shown.map((room, i) => <RoomCard key={room.slug} room={room} index={i} />)}
        </div>
      </section>

      {/* 4. Meal plans */}
      <section className="smeals wrap" aria-labelledby="smeals-title">
        <Sketch name="thali" className="smeals-sketch" />
        <div className="smeals-head">
          <h2 id="smeals-title">Four ways to eat</h2>
          <p>Offered on every stay, except that the dormitory cottage starts with breakfast</p>
        </div>
        <MealPlans />
      </section>
    </>
  );
}
