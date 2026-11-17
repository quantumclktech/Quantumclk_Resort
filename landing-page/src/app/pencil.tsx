import type { CSSProperties } from "react";

/* Pencil drawings (unit 3.22). A small set of line sketches from the resort's
 * own world: the pool courtyard, a cottage, a thali, the banquet lawn, the
 * zipline, a Chalukyan temple, the hills, a bonfire and a banyan tree.
 *
 * Every stroke has pathLength=1 so it can be drawn in when scrolled into view
 * (SketchObserver adds .is-drawn). Each stroke is laid twice, the second a
 * faint offset copy, and both run through the #pencil filter so the line
 * wobbles and doubles like graphite rather than a vector. Decorative only. */

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;

const DRAWINGS = {
  pool: [
    "M20 102 V56 Q20 30 45 30 Q70 30 70 56 V102",
    "M28 82 H62 M28 82 V102 M62 82 V102",
    "M34 64 q11 -12 22 0",
    "M100 102 V70 H182 V102",
    "M100 86 H140 M140 70 V86 M120 86 V102 M160 86 V102 M140 94 H182 M160 70 V78",
    "M118 80 q7 4 7 24 M138 80 q7 4 7 24 M158 80 q7 4 7 24",
    "M8 104 H192 L180 130 H20 Z",
    "M36 116 q10 -3 20 0 t20 0 M96 122 q10 -3 20 0 t20 0 M126 112 q8 -3 16 0",
    "M84 102 q-6 -20 -16 -28 M84 102 q2 -22 10 -32 M84 102 q8 -14 20 -18",
  ],
  cottage: [
    "M34 62 L100 18 L166 62",
    "M44 60 L100 24 L156 60",
    "M60 50 l8 -5 M72 42 l8 -5 M120 38 l8 5 M132 46 l8 5",
    "M50 60 V108 H150 V60",
    "M88 108 V76 H112 V108 M100 76 V108",
    "M60 72 H78 V90 H60 Z M69 72 V90 M122 72 H140 V90 H122 Z M131 72 V90",
    "M28 108 H196 M28 114 H150",
    "M154 116 H196 L190 132 H160 Z M166 124 q6 -2 12 0",
    "M22 110 Q20 82 26 56 M26 56 q-14 -2 -22 8 M26 56 q12 -6 22 2 M26 56 q-4 -12 -14 -16 M26 56 q8 -10 18 -10",
  ],
  thali: [
    circle(100, 74, 56),
    circle(100, 74, 49),
    circle(70, 54, 11) + " " + circle(92, 40, 11),
    circle(116, 40, 11) + " " + circle(136, 56, 11),
    circle(82, 94, 18),
    "M74 88 q4 -3 8 0 M86 100 q4 -3 8 0",
    ellipse(124, 94, 17, 11),
    "M116 92 l5 -2 M126 89 l5 1 M120 99 l5 -2 M130 97 l4 1",
  ],
  banquet: [
    "M10 30 Q55 50 100 30 Q145 50 190 30",
    circle(32, 38, 2.5) + " " + circle(55, 41, 2.5) + " " + circle(78, 38, 2.5),
    circle(122, 38, 2.5) + " " + circle(145, 41, 2.5) + " " + circle(168, 38, 2.5),
    "M10 30 V122 M190 30 V122",
    ellipse(62, 104, 24, 6) + " M62 110 V122 M54 122 H70",
    ellipse(138, 104, 24, 6) + " M138 110 V122 M130 122 H146",
    "M62 98 V88 M58 88 q4 -7 8 0 M138 98 V88 M134 88 q4 -7 8 0",
    "M32 112 q-2 -12 4 -18 M92 112 q2 -12 -4 -18 M108 112 q-2 -12 4 -18 M168 112 q2 -12 -4 -18",
    "M0 124 H200",
  ],
  zipline: [
    "M0 112 Q40 82 80 102 T160 92 T200 102",
    "M24 122 L34 40 L44 122 M27 96 H41 M30 70 H38 M26 40 H44",
    "M34 40 Q110 70 186 98",
    "M106 64 h10 M111 64 V74",
    circle(111, 79, 4) + " M111 83 L109 97 M109 97 L103 106 M109 97 L115 105 M111 86 L107 76 M111 86 L115 76",
    "M186 98 V124 M180 124 H192",
    "M140 30 q4 -4 8 0 q4 -4 8 0 M160 20 q3 -3 6 0 q3 -3 6 0",
  ],
  temple: [
    "M16 120 H184 M26 112 H174 M26 112 V120 M174 112 V120",
    "M40 112 V76 M58 112 V76 M76 112 V76 M124 112 V76 M142 112 V76 M160 112 V76",
    "M32 76 H168 M36 70 H164",
    "M70 70 L80 38 Q92 22 104 38 L114 70",
    "M76 56 H108 M73 63 H111 M79 46 H105",
    "M92 28 V20 " + circle(92, 17, 2.5),
    "M84 120 V130 H116 V120 M88 125 H112",
    "M90 112 V84 Q92 78 94 84 V112",
  ],
  hills: [
    "M6 104 Q60 40 104 74 Q132 52 194 104",
    "M58 104 Q110 64 160 104",
    "M96 66 Q118 48 132 70",
    circle(156, 40, 12),
    "M36 42 q4 -4 8 0 q4 -4 8 0 M60 30 q3 -3 6 0 q3 -3 6 0",
    "M0 118 q50 -6 100 0 t100 0",
    "M20 128 q40 -4 80 0 t80 0",
  ],
  bonfire: [
    ellipse(100, 118, 46, 8),
    "M66 120 L134 98 M66 98 L134 120",
    "M100 104 q-18 -20 0 -46 q4 18 12 22 q6 -12 0 -24 q18 16 6 48",
    "M94 102 q-6 -12 4 -22 q2 10 8 12",
    circle(84, 46, 1.5) + " " + circle(118, 38, 1.5) + " " + circle(104, 28, 1.5),
    "M20 120 q6 -16 18 -16 q10 0 12 16 M150 120 q4 -16 16 -16 q12 0 14 16",
  ],
  tree: [
    "M92 124 Q96 90 90 70 M108 124 Q104 90 112 70",
    "M40 74 Q30 50 56 44 Q60 22 90 28 Q110 10 134 26 Q164 22 166 48 Q186 58 170 76 Q150 88 120 80 Q100 90 80 82 Q56 90 40 74 Z",
    "M60 52 q10 -6 20 0 M110 34 q10 -6 20 0 M140 56 q8 -4 16 0",
    "M62 84 V120 M72 86 V114 M150 82 V118 M140 84 V110",
    "M16 124 H184",
  ],
  palm: [
    "M70 136 Q64 96 80 52 M120 136 Q130 104 116 66",
    "M74 120 h7 M72 100 h8 M75 80 h7 M123 118 h7 M124 98 h7 M120 82 h6",
    "M80 52 q-22 -6 -40 8 M80 52 q-14 -20 -36 -22 M80 52 q6 -22 26 -30",
    "M80 52 q22 -4 36 10 M80 52 q2 14 -6 30",
    "M116 66 q-16 -14 -34 -12 M116 66 q14 -18 34 -16 M116 66 q20 2 30 18",
    "M28 136 H172",
  ],
  lantern: [
    "M100 0 V24",
    "M84 24 H116 M88 18 H112",
    "M84 24 L78 60 Q100 74 122 60 L116 24",
    "M92 24 L90 64 M108 24 L110 66",
    circle(100, 44, 5),
    "M88 68 L84 94 M100 71 V102 M112 68 L116 94",
    "M150 0 V40 M142 40 H158 L154 62 Q150 66 146 62 Z M150 66 V80",
  ],
  picnic: [
    "M30 118 L60 92 H170 L190 118 Z",
    "M48 102 H178 M40 110 H184",
    "M86 92 V74 H124 V92 M92 74 Q105 56 118 74",
    "M86 83 H124 M98 74 V92 M110 74 V92",
    ellipse(150, 104, 10, 3) + " M62 102 v-7 h8 v7",
    "M18 118 Q24 84 18 60",
    "M18 60 q-16 -4 -12 -20 q4 -16 22 -12 q14 -10 24 4 q12 8 0 22 q-10 10 -34 6",
    "M140 30 q4 -4 8 0 q4 -4 8 0",
  ],
  dinner: [
    ellipse(100, 92, 46, 14),
    ellipse(100, 90, 30, 8),
    "M40 70 V112 M36 70 v12 q4 6 8 0 v-12 M40 70 V64",
    "M160 64 V112 M160 64 q8 10 0 26",
    "M140 30 q-2 22 10 26 q12 -4 10 -26 Z M150 56 V76 M142 78 H158",
    "M14 120 H186",
  ],
  glasses: [
    "M60 40 L52 84 q10 10 20 0 L64 40 Z",
    "M62 92 V118 M52 120 H72",
    "M138 40 L130 84 q10 10 20 0 L142 40 Z",
    "M140 92 V118 M130 120 H150",
    "M56 60 H68 M134 60 H146",
    "M82 30 l8 -10 M100 24 V10 M118 30 l-8 -10",
    "M20 126 H180",
  ],
  lotus: [
    "M100 104 Q84 76 100 44 Q116 76 100 104 Z",
    "M100 104 Q70 92 66 62 Q92 72 100 104",
    "M100 104 Q130 92 134 62 Q108 72 100 104",
    "M100 104 Q60 108 44 88 Q76 84 100 104 M100 104 Q140 108 156 88 Q124 84 100 104",
    "M30 118 q35 -8 70 0 t70 0",
    "M50 128 q25 -5 50 0 t50 0",
  ],
  hotel: [
    "M44 124 V46 H156 V124",
    "M38 46 H162 M44 38 H156 L162 46 M44 38 L38 46",
    "M44 72 H156 M44 98 H156",
    "M56 54 h12 v10 h-12 Z M80 54 h12 v10 h-12 Z M108 54 h12 v10 h-12 Z M132 54 h12 v10 h-12 Z",
    "M56 80 h12 v10 h-12 Z M80 80 h12 v10 h-12 Z M108 80 h12 v10 h-12 Z M132 80 h12 v10 h-12 Z",
    "M88 124 V106 H112 V124 M82 106 H118",
    "M22 124 Q19 104 26 90 M26 90 q-10 -2 -14 6 M26 90 q8 -6 16 0 M26 90 q-2 -8 -10 -10",
    "M178 124 Q181 104 174 90 M174 90 q10 -2 14 6 M174 90 q-8 -6 -16 0 M174 90 q2 -8 10 -10",
    "M8 126 H192",
  ],
  games: [
    "M40 88 L160 88 L182 106 L18 106 Z",
    "M100 88 V78 M74 78 H126 M74 78 L64 92 M126 78 L136 92",
    "M28 106 V126 M172 106 V126 M58 106 V120 M142 106 V120",
    circle(46, 54, 11) + " M54 62 l9 11",
    circle(154, 50, 11) + " M146 58 l-9 11",
    circle(100, 42, 3),
  ],
  rain: [
    "M36 18 H164 M60 18 v9 M100 18 v9 M140 18 v9",
    "M60 36 v6 M56 50 v6 M64 62 v6 M100 34 v6 M140 36 v6 M136 50 v6 M144 64 v6",
    circle(100, 82, 6),
    "M100 88 L98 106 M98 106 L90 122 M98 106 L106 122 M100 94 L86 82 M100 94 L114 80",
    "M70 122 q4 -6 8 0 M122 122 q4 -6 8 0 M44 118 q3 -4 6 0",
    "M18 126 H182",
  ],
  cinema: [
    "M50 20 H150 V80 H50 Z",
    "M64 66 q18 -16 36 -4 t36 -6",
    "M60 80 V112 M140 80 V112",
    "M30 122 q0 -16 16 -16 q16 0 16 16 Z M84 122 q0 -16 16 -16 q16 0 16 16 Z M138 122 q0 -16 16 -16 q16 0 16 16 Z",
    "M178 16 a10 10 0 1 0 8 18 a8 8 0 1 1 -8 -18",
    "M18 18 h6 M21 15 v6 M30 44 h4 M32 42 v4 M168 56 h4 M170 54 v4",
    "M8 124 H192",
  ],
} as const;

export type SketchName = keyof typeof DRAWINGS;

export function Sketch({ name, className = "", label }: { name: SketchName; className?: string; label?: string }) {
  const paths = DRAWINGS[name];
  return (
    <svg
      className={`sketch ${className}`}
      viewBox="0 0 200 140"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
    >
      <g filter="url(#pencil)">
        {paths.map((d, i) => (
          <path key={i} d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
        ))}
        <g className="sketch-ghost" transform="translate(0.8 0.6)">
          {paths.map((d, i) => (
            <path key={i} d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** A string of festoon lights for a wide band (the gatherings opening):
 *  three swags between four poles, a bulb hanging at each drop. */
export function LightString({ className = "" }: { className?: string }) {
  const poles = [20, 420, 800, 1180];
  const swags: string[] = [];
  const bulbs: [number, number][] = [];
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i];
    const b = poles[i + 1];
    const mid = (a + b) / 2;
    swags.push(`M${a} 20 Q${mid} 92 ${b} 20`);
    for (let k = 1; k <= 5; k++) {
      const t = k / 6;
      // Point on the quadratic curve at t.
      const x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * mid + t * t * b;
      const y = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 92 + t * t * 20;
      bulbs.push([x, y]);
    }
  }
  const strokes = [
    ...swags,
    ...poles.map((x) => `M${x} 0 V36`),
    ...bulbs.map(([x, y]) => `M${x} ${y} v6 ${circle(x, y + 12, 5).slice(0)}`),
  ];
  return (
    <svg className={`sketch ${className}`} viewBox="0 0 1200 120" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMin meet">
      <g filter="url(#pencil)">
        {strokes.map((d, i) => (
          <path key={i} d={d} pathLength={1} style={{ "--i": Math.min(i, 12) } as CSSProperties} />
        ))}
      </g>
    </svg>
  );
}

/** The filter every sketch uses: a little turbulence displaces each line so it
 *  reads as drawn by hand. Rendered once, in the root layout. */
export function PencilDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
