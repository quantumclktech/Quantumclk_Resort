import { useEffect, useState } from "react";

/* Opening-hours helpers for the dining page (unit 3.20). Windows are decimal
 * hours taken from each outlet's timing string in dining-data.ts. */

export type OpenWindow = [number, number];

/** 10.5 -> "10:30 AM", 23 -> "11 PM". */
export function fmtHour(hour: number) {
  const h = Math.floor(hour) % 12 || 12;
  const mins = Math.round((hour % 1) * 60);
  return `${h}${mins ? `:${String(mins).padStart(2, "0")}` : ""} ${hour < 12 ? "AM" : "PM"}`;
}

/** [[7, 23]] -> "7 AM – 11 PM"; two sittings are joined with a dot. */
export function hoursLabel(windows: OpenWindow[] = []) {
  return windows.map(([from, to]) => `${fmtHour(from)} – ${fmtHour(to)}`).join(" · ");
}

/** Whether the outlet is serving at `now`, said in words a guest can act on. */
export function statusAt(windows: OpenWindow[] = [], now: number) {
  const current = windows.find(([from, to]) => now >= from && now < to);
  if (current) return { open: true, label: `Open until ${fmtHour(current[1])}` };
  const next = windows.find(([from]) => from > now) ?? windows[0];
  return { open: false, label: next ? `Opens ${fmtHour(next[0])}` : "Closed" };
}

/** The visitor's clock as a decimal hour, or null until the page has mounted.
 *  The server cannot know the visitor's time, so rendering it there would
 *  hydrate into a different value. */
export function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(d.getHours() + d.getMinutes() / 60);
  }, []);
  return now;
}

/** "Banquet & Day-Outing Dining" -> "banquet-and-day-outing-dining". */
export function outletSlug(name: string) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
