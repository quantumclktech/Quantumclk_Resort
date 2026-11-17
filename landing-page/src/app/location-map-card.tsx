"use client";

import { useState } from "react";
import { ArrowRight } from "./icons";

interface LocationMapCardProps {
  coordinates?: string;
  locationName?: string;
  surveyNo?: string;
  className?: string;
}

export default function LocationMapCard({
  coordinates = "16.239532, 75.625928",
  locationName = "Golden Hills Resort & Spa",
  surveyNo = "Survey No. 162/2A, Anagawadi Village",
  className = "",
}: LocationMapCardProps) {
  const [mapType, setMapType] = useState<"m" | "k">("m"); // 'm' = Roadmap, 'k' = Satellite
  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coordinates)}`;
  
  // Public Google Maps embed URL
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=${mapType}&z=${zoomLevel}&hl=en&ie=UTF8&iwloc=&output=embed`;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 11));
  };

  return (
    <div
      className={`location-map-card ${className}`}
      role="region"
      aria-label={`${locationName} Location and Interactive Map`}
    >
      {/* 1. Header Bar */}
      <div className="map-card-header">
        <div className="map-card-identity">
          <div className="map-pin-badge" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="map-live-ping" />
          </div>
          <div className="map-card-titles">
            <h3 className="map-card-title">{locationName}</h3>
            <span className="map-card-subtitle">Biligi Taluk · Bagalkote Dist · NH-218 Corridor</span>
          </div>
        </div>

        {/* View Mode Switcher (Map vs Satellite) */}
        <div className="map-card-view-toggle" role="group" aria-label="Map view options">
          <button
            type="button"
            className={`map-view-btn ${mapType === "m" ? "active" : ""}`}
            onClick={() => {
              setMapType("m");
              setIsLoaded(false);
            }}
            aria-pressed={mapType === "m"}
          >
            Map
          </button>
          <button
            type="button"
            className={`map-view-btn ${mapType === "k" ? "active" : ""}`}
            onClick={() => {
              setMapType("k");
              setIsLoaded(false);
            }}
            aria-pressed={mapType === "k"}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* 2. Interactive Map Frame */}
      <div className="map-card-frame">
        <iframe
          key={`${mapType}-${zoomLevel}`}
          title={`${locationName} Interactive Map`}
          src={embedUrl}
          className="map-card-iframe"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setIsLoaded(true)}
        />

        {/* Loading Spinner */}
        {!isLoaded && (
          <div className="map-card-loader" aria-live="polite">
            <div className="map-spinner" />
            <span>Loading map</span>
          </div>
        )}

        {/* Zoom Controls Overlay */}
        <div className="map-card-zoom-controls" role="group" aria-label="Map zoom controls">
          <button
            type="button"
            className="map-zoom-btn"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 18}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="map-zoom-btn"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 11}
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      {/* 3. Card Footer with Transit Distances & Action Buttons */}
      <div className="map-card-footer">
        <div className="map-card-address-row">
          <span className="map-card-address">
            <strong>{surveyNo}</strong>, Biligi, Karnataka 587116
          </span>
        </div>

        <div className="map-card-distances" aria-label="Distances to key regional transit hubs and landmarks">
          <span className="map-distance-chip">
            <strong>Almatti Dam</strong> 18 km
          </span>
          <span className="map-distance-chip">
            <strong>Bagalkote Town</strong> 30 km
          </span>
          <span className="map-distance-chip">
            <strong>Badami Caves</strong> 55 km
          </span>
          <span className="map-distance-chip">
            <strong>Hubli Airport</strong> 135 km
          </span>
        </div>

        <div className="map-card-actions">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="map-card-directions-btn"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Get Driving Directions
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="map-card-open-btn"
          >
            Open in Google Maps <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

