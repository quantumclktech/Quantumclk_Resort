/* "Why choose us" as six small icon tiles, one line each (unit 3.18). */

import { AdventureCompass, BedDouble, CoreUtilities, MapPin, Users, Utensils } from "./icons";

export type HighlightItem = {
  icon: "dining" | "venues" | "rooms" | "recreation" | "location" | "infrastructure";
  title: string;
  desc: string;
};

const ICONS = {
  dining: Utensils, venues: Users, rooms: BedDouble,
  recreation: AdventureCompass, location: MapPin, infrastructure: CoreUtilities,
};

export default function HighlightsCards({ items }: { items: HighlightItem[] }) {
  return (
    <ul className="highlight-tiles" aria-label="Why choose Golden Hills">
      {items.map(({ icon, title, desc }) => {
        const Icon = ICONS[icon];
        return (
          <li className="highlight-tile" key={title}>
            <span className="highlight-tile-icon" aria-hidden="true"><Icon size={22} /></span>
            <span className="highlight-tile-title">{title}</span>
            <span className="highlight-tile-desc">{desc}</span>
          </li>
        );
      })}
    </ul>
  );
}
