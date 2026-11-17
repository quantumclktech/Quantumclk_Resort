"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "./icons";

export type AmenityItem = {
  title: string;
  timing: string;
  statLabel?: string;
  statValue?: string;
  image: string;
  /** Disclosure shown on the card: an impression note, or that the photo is not the resort. */
  imageNote: string;
  lead: string;
  highlights: string[];
  rules: string[];
  iconKey: "pool" | "spa" | "gym" | "adventure" | "raindance" | "bonfire" | "core";
};

export default function AmenitiesCards({ amenities }: { amenities: AmenityItem[] }) {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleDetails = (index: number) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const primaryAmenities = amenities.slice(0, 6);
  const coreFacility = amenities.find((a) => a.iconKey === "core") || amenities[6];

  return (
    <div className="amenities-container">
      {/* 3-Column Grid for Recreation & Wellness Amenities */}
      <div className="glass-cards-grid" role="list" aria-label="Recreation & Wellness Facilities">
        {primaryAmenities.map((amenity, idx) => {
          const isExpanded = expandedIndices.includes(idx);
          const statVal = amenity.statValue || amenity.timing.split("–")[0].trim();
          const statLbl = amenity.statLabel || "Timing";

          return (
            <article
              className={`glass-resort-card ${isExpanded ? "is-expanded" : ""}`}
              key={amenity.title}
              role="listitem"
            >
              {/* Full Background Media */}
              <div className="glass-card-media-wrap">
                <Image
                  src={amenity.image}
                  alt={amenity.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
                  className="glass-card-bg-img"
                />
              </div>

              {/* Frosted Glass Blur Overlay on the Text */}
              <div className="glass-card-blur-overlay">
                <div className="glass-card-header">
                  <h3 className="glass-card-title">{amenity.title}</h3>
                </div>

                {/* Minimal Lead Description */}
                <p className="glass-card-desc">{amenity.lead}</p>
                <p className="glass-card-note">{amenity.imageNote}</p>

                {/* Expandable Drawer for Extra Details */}
                <div className={`glass-card-drawer ${isExpanded ? "is-open" : ""}`}>
                  <div className="glass-card-drawer-inner">
                    <span className="glass-drawer-label">Facility highlights</span>
                    <ul className="glass-drawer-list">
                      {amenity.highlights.map((hl) => (
                        <li key={hl}>{hl}</li>
                      ))}
                    </ul>

                    {amenity.rules && amenity.rules.length > 0 && (
                      <>
                        <span className="glass-drawer-label" style={{ marginTop: "8px" }}>
                          Guest guidelines
                        </span>
                        <ul className="glass-drawer-list">
                          {amenity.rules.map((rule) => (
                            <li key={rule}>{rule}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats & More Details Toggle Row */}
                <div className="glass-card-footer">
                  <div className="glass-stat-group">
                    <div className="glass-stat-item">
                      <span className="glass-stat-number">{statVal}</span>
                      <span className="glass-stat-label">{statLbl}</span>
                    </div>
                  </div>

                  {/* Subtle Details Toggle placed neatly on the right */}
                  <button
                    type="button"
                    className="glass-drawer-toggle"
                    onClick={() => toggleDetails(idx)}
                    aria-label={isExpanded ? `Hide details for ${amenity.title}` : `View more details for ${amenity.title}`}
                  >
                    <span>{isExpanded ? "Less details" : "More details"}</span>
                    <ChevronDown size={12} className={`glass-chevron ${isExpanded ? "is-flipped" : ""}`} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Reassurance Banner for Core Infrastructure & Accessibility */}
      {coreFacility && (
        <div className="glass-core-facility-banner" role="region" aria-label="Core Infrastructure & Security">
          <div className="glass-core-bg">
            <Image
              src={coreFacility.image}
              alt="Golden Hills Resort core infrastructure and reception"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="glass-core-img"
            />
          </div>
          <div className="glass-core-content">
            <div className="glass-core-header">
              <span className="glass-core-kicker">Hospitality standards</span>
              <h3 className="glass-core-title">{coreFacility.title}</h3>
              <p className="glass-core-desc">{coreFacility.lead}</p>
              <p className="glass-card-note">{coreFacility.imageNote}</p>
            </div>
            <div className="glass-core-highlights">
              {coreFacility.highlights.map((hl) => (
                <div key={hl} className="glass-core-pill">
                  <span className="core-bullet" aria-hidden="true">•</span>
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
