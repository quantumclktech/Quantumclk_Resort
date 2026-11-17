"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "./icons";
import type { GatheringVenue } from "./gatherings-data";

export default function GatheringsCards({
  venues,
}: {
  venues: GatheringVenue[];
}) {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleCard = (index: number) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const renderCard = (venue: GatheringVenue, idx: number) => {
    const isExpanded = expandedIndices.includes(idx);

    return (
      <article
        className={`ref-card ${isExpanded ? "is-expanded" : ""}`}
        key={venue.name}
        role="listitem"
      >
        {/* Large image on top */}
        <div className="rc-media">
          <div className="rc-media-frame">
            <Image
              src={venue.image}
              alt={venue.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
              className="rc-media-img"
            />
          </div>
        </div>

        {/* Card body */}
        <div className="rc-body">
          <h3 className="rc-name">{venue.name}</h3>
          <p className="rc-desc">{venue.lead}</p>

          {/* Stats row with dividers */}
          <div className="rc-stats-row">
            <span className="rc-stat">{venue.capacity}</span>
            <span className="rc-stat">{venue.venueType}</span>
            <span className="rc-stat">{venue.idealFor}</span>
          </div>

          {/* Expandable details */}
          <div className={`rc-dropdown ${isExpanded ? "is-open" : ""}`}>
            <div className="rc-dropdown-inner">
              <div className="rc-detail-section">
                <span className="rc-detail-label">Venue Highlights</span>
                <ul className="rc-detail-list">
                  {venue.highlights.map((hl) => (
                    <li key={hl}>{hl}</li>
                  ))}
                </ul>
              </div>

              <div className="rc-detail-section">
                <span className="rc-detail-label">AV &amp; Service Inclusions</span>
                <ul className="rc-detail-list">
                  {venue.inclusions.map((inc) => (
                    <li key={inc}>{inc}</li>
                  ))}
                </ul>
              </div>

              <div className="rc-detail-section">
                <span className="rc-detail-label">Catering &amp; Hall Rental Policy</span>
                <ul className="rc-detail-list">
                  {venue.policyNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer: dropdown toggle + CTA */}
          <div className="rc-footer">
            <button
              type="button"
              className="rc-more-btn"
              aria-label={isExpanded ? `Hide details for ${venue.name}` : `View details for ${venue.name}`}
              onClick={() => toggleCard(idx)}
            >
              <span>{isExpanded ? "Less details" : "More details"}</span>
              <ChevronDown size={12} className={`rc-chevron ${isExpanded ? "is-flipped" : ""}`} />
            </button>

            <Link href="/plan-ahead#enquiries" className="rc-cta-btn">
              Inquire Venue
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="ref-cards-grid" role="region" aria-label="Resort Celebration & Banquet Venues">
      <div className="ref-cards-columns" role="list">
        <div className="ref-cards-col">
          {venues[0] && renderCard(venues[0], 0)}
          {venues[3] && renderCard(venues[3], 3)}
        </div>
        <div className="ref-cards-col">
          {venues[1] && renderCard(venues[1], 1)}
          {venues[4] && renderCard(venues[4], 4)}
        </div>
        <div className="ref-cards-col">
          {venues[2] && renderCard(venues[2], 2)}
          {venues[5] && renderCard(venues[5], 5)}
        </div>
      </div>

      <div className="ref-cards-mobile" role="list">
        {venues.map((venue, idx) => renderCard(venue, idx))}
      </div>

      <p className="cards-editorial-footnote">
        Architectural concept impressions. Seating layouts, AV capabilities, and customized per-plate banquet catering confirmed during pre-opening planning.
      </p>
    </div>
  );
}

