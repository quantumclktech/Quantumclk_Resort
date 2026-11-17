import Image from "next/image";
import { getScene } from "./resort-assets";
import type { DiningOutlet } from "./dining-cards";

/* /dining — alternating bands on a dark page (unit 3.18, phase 4). Dining
 * here is an evening room, so the page carries the forest tone and the
 * photographs supply the light. Name, cuisine and hours only. */

export default function DiningBands({ outlets }: { outlets: DiningOutlet[] }) {
  return (
    <ul className="band-list" aria-label="Dining outlets">
      {outlets.map((outlet, index) => (
        <li key={outlet.name} className={`band${index % 2 ? " is-reversed" : ""}`}>
          <div className="band-media">
            <Image
              {...getScene(outlet.sceneId)}
              alt={outlet.imageAlt}
              sizes="(max-width: 860px) 100vw, 52vw"
            />
          </div>
          <div className="band-body">
            <p className="band-tag">{outlet.tag}</p>
            <h2 className="band-name">{outlet.name}</h2>
            <dl className="band-meta">
              <div><dt>Hours</dt><dd>{outlet.timing}</dd></div>
              <div><dt>Kitchen</dt><dd>{outlet.cuisine}</dd></div>
            </dl>
            <details className="band-more">
              <summary>What is served</summary>
              <ul>
                {[...outlet.highlights, ...outlet.serviceNotes].map((line) => <li key={line}>{line}</li>)}
              </ul>
            </details>
          </div>
        </li>
      ))}
    </ul>
  );
}
