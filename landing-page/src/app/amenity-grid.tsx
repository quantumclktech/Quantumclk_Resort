"use client";

/* Home page amenities as small icon tiles (unit 3.18). Replaces six large
 * photo cards, five of which were stock photos of other places. Tapping a
 * tile opens one panel under the grid with that facility's details, so the
 * facts stay on the page without the grid changing shape. */

import { useState } from "react";
import {
  AdventureCompass, BonfireFlame, CoreUtilities, GymFitness, PoolWaves,
  RainDanceMist, SpaLotus, Wifi,
} from "./icons";

export type AmenityTile = {
  icon: "pool" | "spa" | "gym" | "adventure" | "raindance" | "bonfire" | "wifi" | "core";
  label: string;
  hours: string;
  details: string[];
};

const ICONS = {
  pool: PoolWaves, spa: SpaLotus, gym: GymFitness, adventure: AdventureCompass,
  raindance: RainDanceMist, bonfire: BonfireFlame, wifi: Wifi, core: CoreUtilities,
};

export default function AmenityGrid({ tiles }: { tiles: AmenityTile[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? null : tiles[open];

  return (
    <div className="amenity-grid-wrap">
      <ul className="amenity-grid">
        {tiles.map((tile, index) => {
          const Icon = ICONS[tile.icon];
          const active = open === index;
          return (
            <li key={tile.label}>
              <button
                type="button"
                className={`amenity-tile${active ? " is-active" : ""}`}
                aria-expanded={active}
                aria-controls="amenity-panel"
                onClick={() => setOpen(active ? null : index)}
              >
                <span className="amenity-tile-icon" aria-hidden="true"><Icon size={22} /></span>
                <span className="amenity-tile-label">{tile.label}</span>
                <span className="amenity-tile-hours">{tile.hours}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div id="amenity-panel" className="amenity-panel" hidden={!current} aria-live="polite">
        {current && (
          <>
            <p className="amenity-panel-title">{current.label} <span>· {current.hours}</span></p>
            <ul>
              {current.details.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
