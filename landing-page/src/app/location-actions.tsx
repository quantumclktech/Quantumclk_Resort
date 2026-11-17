"use client";

import { useState } from "react";
import { ArrowRight } from "./icons";

export default function LocationActions() {
  const [copied, setCopied] = useState(false);
  const coordinates = "16.239532, 75.625928";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coordinates);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <div className="location-interactive-card">
      <div className="location-geo-info">
        <span className="location-geo-label">GPS geolocation</span>
        <code className="location-coords">16.239532° N, 75.625928° E</code>
      </div>
      <div className="location-actions-row">
        <button
          type="button"
          onClick={handleCopy}
          className="location-copy-btn"
          aria-label="Copy GPS coordinates"
        >
          {copied ? "✓ Copied to clipboard" : "Copy GPS Coordinates"}
        </button>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="location-maps-link"
        >
          Open in Google Maps <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
