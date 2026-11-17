"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "./icons";
import type { ExperienceCategory } from "./experiences-data";

export default function ExperiencesCards({
  experiences,
}: {
  experiences: ExperienceCategory[];
}) {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleCard = (index: number) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const renderCard = (exp: ExperienceCategory, idx: number) => {
    const isExpanded = expandedIndices.includes(idx);

    return (
      <article
        className={`ref-card ${isExpanded ? "is-expanded" : ""}`}
        key={exp.name}
        role="listitem"
      >
        {/* Large image on top */}
        <div className="rc-media">
          <div className="rc-media-frame">
            <Image
              src={exp.image}
              alt={exp.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
              className="rc-media-img"
            />
          </div>
        </div>

        {/* Card body */}
        <div className="rc-body">
          <h3 className="rc-name">{exp.name}</h3>
          <p className="rc-desc">{exp.lead}</p>

          {/* Stats row with dividers */}
          <div className="rc-stats-row">
            <span className="rc-stat">{exp.duration}</span>
            <span className="rc-stat">{exp.idealFor}</span>
            <span className="rc-stat">{exp.venue}</span>
          </div>

          {/* Expandable details */}
          <div className={`rc-dropdown ${isExpanded ? "is-open" : ""}`}>
            <div className="rc-dropdown-inner">
              <div className="rc-detail-section">
                <span className="rc-detail-label">Experience Highlights</span>
                <ul className="rc-detail-list">
                  {exp.highlights.map((hl) => (
                    <li key={hl}>{hl}</li>
                  ))}
                </ul>
              </div>

              <div className="rc-detail-section">
                <span className="rc-detail-label">Inclusions</span>
                <ul className="rc-detail-list">
                  {exp.inclusions.map((inc) => (
                    <li key={inc}>{inc}</li>
                  ))}
                </ul>
              </div>

              <div className="rc-detail-section">
                <span className="rc-detail-label">Booking &amp; Operating Notes</span>
                <ul className="rc-detail-list">
                  {exp.bookingNotes.map((note) => (
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
              aria-label={isExpanded ? `Hide details for ${exp.name}` : `View details for ${exp.name}`}
              onClick={() => toggleCard(idx)}
            >
              <span>{isExpanded ? "Less details" : "More details"}</span>
              <ChevronDown size={12} className={`rc-chevron ${isExpanded ? "is-flipped" : ""}`} />
            </button>

            <Link href="/plan-ahead#experiences" className="rc-cta-btn">
              Book Experience
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="ref-cards-grid" role="region" aria-label="Curated Resort Experiences">
      <div className="ref-cards-columns" role="list">
        <div className="ref-cards-col">
          {experiences[0] && renderCard(experiences[0], 0)}
          {experiences[3] && renderCard(experiences[3], 3)}
          {experiences[6] && renderCard(experiences[6], 6)}
        </div>
        <div className="ref-cards-col">
          {experiences[1] && renderCard(experiences[1], 1)}
          {experiences[4] && renderCard(experiences[4], 4)}
        </div>
        <div className="ref-cards-col">
          {experiences[2] && renderCard(experiences[2], 2)}
          {experiences[5] && renderCard(experiences[5], 5)}
        </div>
      </div>

      <div className="ref-cards-mobile" role="list">
        {experiences.map((exp, idx) => renderCard(exp, idx))}
      </div>

      <p className="cards-editorial-footnote">
        Architectural concept impressions. Experience operating schedules, culinary menus, and setup configurations confirmed prior to pre-opening.
      </p>
    </div>
  );
}
