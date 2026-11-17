import type { CSSProperties } from "react";
import { Sketch, type SketchName } from "./pencil";
import type { AmenityTile } from "./amenity-grid";

/* Home amenities as a walk through the day (unit 3.26). Six facilities in
 * the order they open, each a pencil drawing on one hand-drawn path, with
 * only a name and its hours. The everyday essentials (Wi-Fi, power,
 * parking, access) are one quiet line beneath, not tiles of their own.
 *
 * Motion: the path draws first, then each stop's drawing in turn (stroke
 * dashoffset, staggered 160ms per stop) — the walk taking place as you
 * reach it. Drawn once, by SketchObserver; reduced motion shows it all. */

const DRAWINGS: Partial<Record<AmenityTile["icon"], SketchName>> = {
  pool: "pool",
  gym: "games",
  adventure: "zipline",
  spa: "lotus",
  raindance: "rain",
  bonfire: "bonfire",
};

/* When each opens, for ordering the walk. Rain dance has no clock time in
 * the data ("sessions run through the afternoon"), so it sits after noon. */
const OPENS: Partial<Record<AmenityTile["icon"], number>> = {
  pool: 7, gym: 7.1, adventure: 10, spa: 11, raindance: 14, bonfire: 19,
};

export default function AmenityTrail({ tiles }: { tiles: AmenityTile[] }) {
  const stops = tiles
    .filter((t) => DRAWINGS[t.icon])
    .sort((a, b) => (OPENS[a.icon] ?? 99) - (OPENS[b.icon] ?? 99));
  const essentials = tiles
    .filter((t) => !DRAWINGS[t.icon])
    .flatMap((t) => t.details)
    .map((line) => line.replace(/\s+across the resort$/i, ""));

  return (
    <div className="atrail">
      <svg className="sketch atrail-path" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g filter="url(#pencil)">
          <path d="M0 70 C 120 20, 220 110, 340 64 S 560 18, 680 70 S 900 116, 1020 60 S 1160 40, 1200 54" pathLength={1} />
          <path className="atrail-path-faint" d="M0 78 C 120 30, 220 118, 340 72 S 560 26, 680 78 S 900 124, 1020 68 S 1160 48, 1200 62" pathLength={1} />
        </g>
      </svg>

      <ol className="atrail-stops">
        {stops.map((tile, index) => (
          <li key={tile.label} className="atrail-stop" style={{ "--stop": index } as CSSProperties}>
            <Sketch name={DRAWINGS[tile.icon]!} />
            <h3>{tile.label}</h3>
            <p>{tile.hours}</p>
          </li>
        ))}
      </ol>

      <p className="atrail-essentials">{essentials.join(" · ")}</p>
    </div>
  );
}
