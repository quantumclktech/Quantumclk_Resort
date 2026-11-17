import Image from "next/image";
import type { GatheringVenue } from "./gatherings-data";

/* /gatherings — a capacity table (unit 3.18, phase 4). When you are choosing
 * a venue the first question is how many people fit, so the number leads each
 * row and the photograph is a thumbnail beside it. */

export default function VenueList({ venues }: { venues: GatheringVenue[] }) {
  return (
    <ul className="venue-rows" aria-label="Celebration venues">
      {venues.map((venue) => (
        <li key={venue.name} className="venue-row">
          <span className="venue-figure">
            <strong>{venue.capacity.replace(/\s*Guests?/i, "")}</strong>
            <span>guests</span>
          </span>
          <span className="venue-main">
            <span className="venue-name">{venue.name}</span>
            <span className="venue-type">{venue.venueType} · {venue.idealFor}</span>
            <details className="venue-more">
              <summary>What is included</summary>
              <ul>
                {[...venue.inclusions, ...venue.policyNotes].map((line) => <li key={line}>{line}</li>)}
              </ul>
            </details>
          </span>
          <span className="venue-thumb">
            <Image src={venue.image} alt={venue.imageAlt} width={480} height={320} sizes="200px" />
          </span>
        </li>
      ))}
    </ul>
  );
}
