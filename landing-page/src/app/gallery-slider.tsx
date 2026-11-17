"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "./icons";
import { getScene, impression } from "./resort-assets";

export type GalleryItem = {
  id: string;
  category: "Pool & cottages" | "Dining & bar" | "Event spaces" | "Interiors & lounge";
  tag: string;
  title: string;
  desc: string;
};

export const galleryLibrary: GalleryItem[] = [
  {
    id: "hero-pool-day-desktop-p37",
    category: "Pool & cottages",
    tag: "Daylight view",
    title: "Daylight Private Pool Courtyard",
    desc: "Private cottage pool with crystal water, stone spout waterfalls, and daybed alcove.",
  },
  {
    id: "hero-pool-arch-mobile-p35",
    category: "Pool & cottages",
    tag: "Arched pavilion",
    title: "Illuminated Pool Arch & Sunken Seat",
    desc: "Courtyard study featuring an illuminated architectural arch and submerged pool loungers.",
  },
  {
    id: "cottage-entry-p32",
    category: "Pool & cottages",
    tag: "Exterior entrance",
    title: "Cottage Garden Entryway",
    desc: "Stone pathways and lush privacy foliage transitioning from resort grounds into private cottage gates.",
  },
  {
    id: "cottage-pool-overhead-p33",
    category: "Pool & cottages",
    tag: "Overhead perspective",
    title: "Overhead Pool Villa Layout",
    desc: "Bird's-eye architectural view showing private plunge pool, terrace sunbeds, and perimeter boundary garden.",
  },
  {
    id: "cottage-pool-terrace-p34",
    category: "Pool & cottages",
    tag: "Outdoor living",
    title: "Shaded Poolside Terrace Lounge",
    desc: "Timber-framed shade pavilion with comfortable day loungers and direct steps into the private pool.",
  },
  {
    id: "dusk-pool-candidate-p38",
    category: "Pool & cottages",
    tag: "Evening atmosphere",
    title: "Dusk Pool Courtyard",
    desc: "Evening lighting scheme highlighting glowing pool water, garden foliage, and architectural stonework.",
  },
  {
    id: "arrival-reception-lounge-p11",
    category: "Interiors & lounge",
    tag: "Main complex",
    title: "Grand Double-Height Reception Lounge",
    desc: "Full-height glass facade, ribbed stone columns, and panoramic views opening onto central resort courtyards.",
  },
  {
    id: "cottage-interior-front-bed-p40",
    category: "Interiors & lounge",
    tag: "Master bedroom",
    title: "Cottage Bedroom & Timber Ceiling",
    desc: "Exposed natural timber roof beams, platform queen bed, botanical artwork, and warm bedside lighting.",
  },
  {
    id: "cottage-interior-bed-and-bath-p39",
    category: "Interiors & lounge",
    tag: "Suite layout",
    title: "Cottage Bedroom & Ensuite Bathroom Flow",
    desc: "Open-plan flow between sleeping quarters and modern luxury ensuite bathroom with textured stone finishes.",
  },
  {
    id: "cottage-interior-tv-wall-p41",
    category: "Interiors & lounge",
    tag: "Living space",
    title: "Cottage Entertainment & Lounge Wall",
    desc: "Integrated media console wall with fluted wood paneling, luggage credenza, and custom storage cabinetry.",
  },
  {
    id: "dining-veg-seating-p13",
    category: "Dining & bar",
    tag: "Pure veg outlet",
    title: "Pure Vegetarian Dining Hall",
    desc: "Warm interior dining space with pendant chandeliers, upholstered booth banquettes, and woven cane chairs.",
  },
  {
    id: "dining-veg-central-aisle-p12",
    category: "Dining & bar",
    tag: "Vegetarian dining",
    title: "Vegetarian Restaurant Central Aisle",
    desc: "Circulation aisle framed by acoustic wood paneling and decorative hanging pendant lights for family meals.",
  },
  {
    id: "dining-non-veg-aisle-p07",
    category: "Dining & bar",
    tag: "Multi-cuisine",
    title: "Non-Veg Restaurant & Live BBQ Lounge",
    desc: "Curved timber arches, central circulation corridor, and seating for Indian, Italian, and barbecue dining.",
  },
  {
    id: "evening-bar-counter-p03",
    category: "Dining & bar",
    tag: "Cocktail bar",
    title: "Bar Lounge Marble Counter",
    desc: "Custom illuminated backlit onyx bar counter with brass bar stools and expansive spirit display shelving.",
  },
  {
    id: "evening-bar-wide-p09",
    category: "Dining & bar",
    tag: "Lounge seating",
    title: "Evening Bar Lounge Seating",
    desc: "Emerald velvet banquet booths, geometric floor tiling, exposed brick walls, and warm atmospheric downlights.",
  },
  {
    id: "gatherings-banquet-p03",
    category: "Event spaces",
    tag: "Banquet hall",
    title: "Conference & Banquet Hall Setup",
    desc: "Climate-controlled hall with exposed timber roof trusses, clothed round tables, and stage for celebrations.",
  },
  {
    id: "gatherings-theatre-p05",
    category: "Event spaces",
    tag: "Corporate seminars",
    title: "Conference Hall Seminar Layout",
    desc: "Auditorium / theater seating configuration equipped with presentation AV projection for business conferences.",
  },
];

const categories = ["All", "Pool & cottages", "Dining & bar", "Interiors & lounge", "Event spaces"] as const;

export default function GallerySlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<typeof categories[number]>("All");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const filteredItems = activeFilter === "All"
    ? galleryLibrary
    : galleryLibrary.filter((item) => item.category === activeFilter);

  const handleScroll = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const pct = Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100));
    setScrollProgress(pct);
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
  };

  function scroll(direction: "left" | "right") {
    if (!trackRef.current) return;
    const scrollAmount = trackRef.current.clientWidth * 0.75;
    trackRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }

  return (
    <div className="gallery-slider">
      {/* Category filter pills and scroll navigation controls */}
      <div className="gallery-toolbar">
        <div className="gallery-filters" role="tablist" aria-label="Filter gallery images">
          {categories.map((category) => {
            const count = category === "All"
              ? galleryLibrary.length
              : galleryLibrary.filter((i) => i.category === category).length;
            const isActive = activeFilter === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`gallery-filter-btn ${isActive ? "is-active" : ""}`}
                onClick={() => {
                  setActiveFilter(category);
                  setScrollProgress(0);
                  setCanScrollLeft(false);
                  setCanScrollRight(true);
                  trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                }}
              >
                {category} <span className="gallery-filter-count">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="gallery-controls" aria-label="Horizontal scroll navigation">
          <button
            type="button"
            className="gallery-nav-btn"
            aria-label="Scroll left in gallery"
            disabled={!canScrollLeft}
            style={{ opacity: canScrollLeft ? 1 : 0.4 }}
            onClick={() => scroll("left")}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            className="gallery-nav-btn"
            aria-label="Scroll right in gallery"
            disabled={!canScrollRight}
            style={{ opacity: canScrollRight ? 1 : 0.4 }}
            onClick={() => scroll("right")}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track with Edge Fade Scrim Indicators */}
      <div className={`gallery-track-container ${canScrollLeft ? "has-left-overflow" : ""} ${canScrollRight ? "has-right-overflow" : ""}`}>
        <div
          ref={trackRef}
          className="gallery-track"
          tabIndex={0}
          role="region"
          aria-label="Horizontal gallery scroll track"
          onScroll={handleScroll}
        >
          {filteredItems.map((item) => {
            const scene = getScene(item.id);
            return (
              <article className="gallery-slide" key={item.id}>
                <div className="gallery-slide-media">
                  <Image
                    src={scene.src}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 85vw, (max-width: 1200px) 45vw, 420px"
                    className="gallery-slide-img"
                  />
                  <span className="gallery-slide-badge">{item.tag}</span>
                </div>
                <div className="gallery-slide-body">
                  <div className="gallery-slide-meta">
                    <span className="gallery-slide-category">{item.category}</span>
                    <h4>{item.title}</h4>
                  </div>
                  <div className="gallery-slide-footer">
                    <span className="gallery-slide-disclosure">{impression}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Mobile/Desktop Scroll Progress & Count Hint */}
      <div className="gallery-indicator-bar">
        <div className="gallery-progress-track" aria-hidden="true">
          <div
            className="gallery-progress-thumb"
            style={{ width: `${Math.max(10, scrollProgress)}%` }}
          />
        </div>
        <p className="gallery-scroll-hint">
          Swipe horizontally to explore all {filteredItems.length} perspectives
        </p>
      </div>
    </div>
  );
}

