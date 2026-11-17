"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, Map as FaMap } from "lucide-react";

export interface ViewOnMapProps {
  locationName?: string;
  address?: string;
  mapImageUrl?: string;
  className?: string;
}

export const ViewOnMap: React.FC<ViewOnMapProps> = ({
  locationName = "Golden Hills Resort, Biligi",
  address = "16.239532, 75.625928",
  mapImageUrl = "/assets/resort/cottage-pool-overhead-p33.webp",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen) setIsMapLoaded(false);
  };

  const springConfig = {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  };

  // Google Maps embed URL centered on the exact resort GPS coordinates
  const publicMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    address
  )}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={`vom-wrapper ${className}`} style={{ position: "relative" }}>
      <AnimatePresence mode="popLayout">
        {!isOpen ? (
          /* --- COMPACT PILL / CARD BUTTON --- */
          <motion.div
            key="button"
            layoutId="map-container"
            onClick={toggleOpen}
            className="vom-button"
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              height: 42,
              padding: "0 18px",
              borderRadius: "999px",
              backgroundColor: "var(--color-limestone, #e8e1d7)",
              border: "1px solid var(--color-line, #c3c9bd)",
              boxShadow: "0 2px 8px rgba(24, 36, 29, 0.08)",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springConfig}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            role="button"
            tabIndex={0}
            aria-label={`Open interactive map for ${locationName}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleOpen();
              }
            }}
          >
            {/* Background texture preview */}
            <motion.div
              layoutId="map-bg"
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.25,
                backgroundImage: `url(${mapImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "grayscale(60%) contrast(1.1)",
              }}
            />

            <motion.div
              style={{
                position: "relative",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FaMap
                style={{
                  width: 15,
                  height: 15,
                  color: "var(--color-brass, #b88828)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  color: "var(--color-ink, #18241d)",
                  whiteSpace: "nowrap",
                }}
              >
                View on Map
              </span>
            </motion.div>
          </motion.div>
        ) : (
          /* --- EXPANDED LIVE INTERACTIVE MAP --- */
          <motion.div
            key="map"
            layoutId="map-container"
            className="vom-expanded-card"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 440,
              aspectRatio: "4 / 3",
              overflow: "hidden",
              backgroundColor: "var(--color-paper, #f7f2ec)",
              borderRadius: "var(--radius-card, 16px)",
              border: "1px solid var(--color-line, #c3c9bd)",
              boxShadow: "0 14px 40px -8px rgba(24, 36, 29, 0.22)",
            }}
            transition={springConfig}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            >
              <iframe
                title={`Google Map - ${locationName}`}
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  width: "100%",
                  height: "100%",
                }}
                src={publicMapUrl}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setIsMapLoaded(true)}
              />
            </motion.div>

            {/* Loading Indicator */}
            {!isMapLoaded && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  backgroundColor: "rgba(247, 242, 236, 0.92)",
                  color: "var(--color-muted, #596a5e)",
                  fontSize: "12px",
                  zIndex: 20,
                }}
              >
                <Loader2
                  className="animate-spin"
                  style={{
                    width: 28,
                    height: 28,
                    color: "var(--color-forest, #104028)",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span>Loading Golden Hills Resort location...</span>
              </div>
            )}

            {/* Top Bar Location Badge */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                zIndex: 30,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                backgroundColor: "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                borderRadius: "var(--radius-pill, 999px)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-forest, #104028)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "#e53e3e",
                }}
              />
              <span>16.239532° N, 75.625928° E</span>
            </div>

            {/* Close Button */}
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={toggleOpen}
              aria-label="Close map preview"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                border: "1px solid rgba(24, 36, 29, 0.15)",
                color: "var(--color-ink, #18241d)",
                boxShadow: "0 3px 12px rgba(0, 0, 0, 0.18)",
                cursor: "pointer",
                transition: "background-color 0.15s ease, transform 0.15s ease",
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <X style={{ width: 16, height: 16 }} strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewOnMap;

