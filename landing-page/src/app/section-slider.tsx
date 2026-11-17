"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "./icons";

export type SliderSlide = {
  src: string;
  label: string;
  alt: string;
};

export default function SectionSlider({
  slides,
  aspectRatio = "16 / 10",
  ariaLabel = "Facility and venue perspectives",
}: {
  slides: SliderSlide[];
  aspectRatio?: string;
  ariaLabel?: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const active = slides[currentIdx] || slides[0];

  return (
    <div className="section-slider-container" aria-label={ariaLabel}>
      <div className="section-slider-frame" style={{ aspectRatio, position: "relative" }}>
        <Image
          src={active.src}
          alt={active.alt}
          fill
          sizes="(max-width: 900px) 100vw, 48vw"
          className="section-slider-img"
          priority={false}
        />

        {slides.length > 1 && (
          <>
            {/* Navigation Arrows */}
            <button
              type="button"
              className="section-slider-nav prev"
              onClick={prevSlide}
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="section-slider-nav next"
              onClick={nextSlide}
              aria-label="Next image"
            >
              <ChevronRight size={16} />
            </button>

            {/* Slide Label and Counter */}
            <div className="section-slider-meta">
              <span className="section-slider-counter">
                {currentIdx + 1} / {slides.length}
              </span>
              <span className="section-slider-label">{active.label}</span>
            </div>

            {/* Dots */}
            <div className="section-slider-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`section-slider-dot ${i === currentIdx ? "is-active" : ""}`}
                  onClick={() => setCurrentIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <p className="section-slider-footnote">
        Architectural concept impressions. Final setups, staging, and furniture layouts confirmed prior to booking.
      </p>
    </div>
  );
}
