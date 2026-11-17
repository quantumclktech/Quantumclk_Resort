import type { CSSProperties } from "react";

/* A thali drawn in one brass line (unit 3.20). It stands where the hero
 * photograph used to be: the plate, four katoris, a jolada rotti and a mound
 * of rice. Every stroke has pathLength=1 so CSS can draw it in once, in
 * order, on first paint (see .dthali in dining.css). Decorative only. */

const KATORIS: [number, number][] = [
  [94.7, 161.7],
  [147.4, 101.1],
  [227.1, 91.3],
  [292.9, 137.4],
];

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export default function ThaliArt() {
  let i = 0;
  return (
    <svg className="dthali" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <circle cx="200" cy="200" r="182" pathLength={1} style={step(i++)} />
      <circle cx="200" cy="200" r="166" pathLength={1} style={step(i++)} className="dthali-faint" />

      {KATORIS.map(([cx, cy]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r="33" pathLength={1} style={step(i)} />
          <circle cx={cx} cy={cy} r="25" pathLength={1} style={step(i++)} className="dthali-faint" />
        </g>
      ))}

      {/* Jolada rotti, with three char marks from the tava. */}
      <circle cx="150" cy="262" r="52" pathLength={1} style={step(i++)} />
      <path d="M128 250 q8 -6 16 0" pathLength={1} style={step(i)} />
      <path d="M156 276 q8 -6 16 0" pathLength={1} style={step(i)} />
      <path d="M140 284 q6 -4 12 0" pathLength={1} style={step(i++)} />

      {/* Rice, with a few grains. */}
      <ellipse cx="262" cy="262" rx="46" ry="32" pathLength={1} style={step(i++)} />
      <path d="M244 254 l8 -3" pathLength={1} style={step(i)} />
      <path d="M262 248 l8 2" pathLength={1} style={step(i)} />
      <path d="M252 270 l7 -4" pathLength={1} style={step(i)} />
      <path d="M272 266 l8 1" pathLength={1} style={step(i)} />
      <path d="M282 252 l5 5" pathLength={1} style={step(i++)} />

      {/* A leaf of greens tucked against the rim. */}
      <path d="M232 318 q26 -26 58 -12 q-22 30 -58 12 z" pathLength={1} style={step(i)} />
      <path d="M236 316 q24 -6 48 -9" pathLength={1} style={step(i++)} className="dthali-faint" />
    </svg>
  );
}
