"use client";

import type { DiningOutlet } from "./dining-cards";
import { hoursLabel, outletSlug } from "./dining-hours";
import { MenuButton } from "./dining-menu";

/* The hero's index of the six dining outlets (unit 3.20).
 * Displays each kitchen with its opening and closing time in a single clean column.
 * Clicking jumps directly to that outlet's section below. */

export default function DiningIndex({ outlets }: { outlets: DiningOutlet[] }) {
  return (
    <div className="dindex">
      <ol className="dindex-list">
        {outlets.map((outlet, index) => (
          <li key={outlet.name} className="dindex-item" style={{ "--i": index } as React.CSSProperties}>
            <a
              href={`#${outletSlug(outlet.name)}`}
              className="dindex-row"
            >
              <span className="dindex-num">{String(index + 1).padStart(2, "0")}</span>
              <span className="dindex-name">{outlet.name}</span>
              <span className="dindex-hours">{hoursLabel(outlet.openWindows)}</span>
            </a>
            <MenuButton index={index} name={outlet.name} />
          </li>
        ))}
      </ol>
    </div>
  );
}
