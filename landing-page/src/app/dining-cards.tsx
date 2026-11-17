"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "./icons";
import { getScene } from "./resort-assets";

export type DiningOutlet = {
  name: string;
  tag: string;
  timing: string;
  cuisine: string;
  lead: string;
  highlights: string[];
  serviceNotes: string[];
  sceneId: string;
  imageAlt: string;
  imageLabel: string;
  /* Added for the hours chart (unit 3.20): the outlet's open windows as
   * decimal hours, read straight off the timing string above. Optional, so
   * nothing that used this type before needs to change. */
  openWindows?: [number, number][];
  mark?: "thali" | "grill" | "cocktail" | "burger" | "coffee" | "buffet";
  /* Added for the menu panel (unit 3.21). `dishes` are three short tags and
   * `menuPreview` the grouped lines shown until a real menu exists, both cut
   * down from this outlet's own copy, nothing new. `menuFile` is the real
   * menu once the resort supplies it: a path under /public, PDF or image. */
  dishes?: string[];
  menuPreview?: { heading: string; items: string[] }[];
  menuFile?: string;
};

export default function DiningCards({ outlets }: { outlets: DiningOutlet[] }) {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleCard = (index: number) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const renderCard = (outlet: DiningOutlet, idx: number) => {
    const isExpanded = expandedIndices.includes(idx);
    const scene = getScene(outlet.sceneId);

    return (
      <article
        className={`ref-card ${isExpanded ? "is-expanded" : ""}`}
        key={outlet.name}
        role="listitem"
      >
        {/* Large image on top */}
        <div className="rc-media">
          <div className="rc-media-frame">
            <Image
              src={scene.src}
              alt={outlet.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
              className="rc-media-img"
            />
          </div>
        </div>

        {/* Card body */}
        <div className="rc-body">
          <h3 className="rc-name">{outlet.name}</h3>
          <p className="rc-desc">{outlet.lead}</p>

          {/* Stats row */}
          <div className="rc-stats-row">
            <span className="rc-stat">{outlet.timing}</span>
            <span className="rc-stat">{outlet.cuisine}</span>
          </div>

          {/* Expandable details */}
          <div className={`rc-dropdown ${isExpanded ? "is-open" : ""}`}>
            <div className="rc-dropdown-inner">
              <div className="rc-detail-section">
                <span className="rc-detail-label">Culinary Highlights</span>
                <ul className="rc-detail-list">
                  {outlet.highlights.map((hl) => (
                    <li key={hl}>{hl}</li>
                  ))}
                </ul>
              </div>

              <div className="rc-detail-section">
                <span className="rc-detail-label">Service Notes</span>
                <ul className="rc-detail-list">
                  {outlet.serviceNotes.map((note) => (
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
              aria-label={isExpanded ? `Hide details for ${outlet.name}` : `View details for ${outlet.name}`}
              onClick={() => toggleCard(idx)}
            >
              <span>{isExpanded ? "Less details" : "More details"}</span>
              <ChevronDown size={12} className={`rc-chevron ${isExpanded ? "is-flipped" : ""}`} />
            </button>

            <button type="button" className="rc-cta-btn" aria-label={`View menu for ${outlet.name}`}>
              View Menu
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="ref-cards-grid" role="region" aria-label="Dining Outlets List">
      <div className="ref-cards-columns" role="list">
        <div className="ref-cards-col">
          {outlets[0] && renderCard(outlets[0], 0)}
          {outlets[3] && renderCard(outlets[3], 3)}
        </div>
        <div className="ref-cards-col">
          {outlets[1] && renderCard(outlets[1], 1)}
          {outlets[4] && renderCard(outlets[4], 4)}
        </div>
        <div className="ref-cards-col">
          {outlets[2] && renderCard(outlets[2], 2)}
          {outlets[5] && renderCard(outlets[5], 5)}
        </div>
      </div>

      <div className="ref-cards-mobile" role="list">
        {outlets.map((outlet, idx) => renderCard(outlet, idx))}
      </div>

      <p className="cards-editorial-footnote">
        Architectural concept impressions. Operational hours, kitchen segregation standards, and menus confirmed prior to pre-opening.
      </p>
    </div>
  );
}
