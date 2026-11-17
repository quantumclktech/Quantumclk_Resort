import Image from "next/image";
import type { ExperienceCategory } from "./experiences-data";
import { Clock, MapPin, Users } from "./icons";

/* /experiences — tall portrait tiles (unit 3.18, phase 4). An experience is
 * a moment, so the picture carries it and the words are reduced to who it
 * suits, how long it runs and where. A magazine page, not a card grid. */

export default function ExperienceTiles({ experiences }: { experiences: ExperienceCategory[] }) {
  return (
    <ul className="tile-wall" aria-label="Signature experiences">
      {experiences.map((item, index) => (
        <li key={item.name} className={`tile${index === 0 ? " is-lead" : ""}`}>
          <Image
            src={item.image}
            alt={item.imageAlt}
            width={1200}
            height={1600}
            sizes="(max-width: 700px) 86vw, (max-width: 1100px) 46vw, 31vw"
            className="tile-img"
          />
          <div className="tile-text">
            <h2>{item.name}</h2>
            <ul className="tile-meta">
              <li><Users size={14} /> {item.idealFor}</li>
              <li><Clock size={14} /> {item.duration}</li>
              <li><MapPin size={14} /> {item.venue}</li>
            </ul>
            <details className="tile-more">
              <summary>What is included</summary>
              <ul>
                {[...item.inclusions, ...item.bookingNotes].map((line) => <li key={line}>{line}</li>)}
              </ul>
            </details>
          </div>
        </li>
      ))}
    </ul>
  );
}
