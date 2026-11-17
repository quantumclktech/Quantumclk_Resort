"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { getScene, impression } from "./resort-assets";
import type { RoomCategory } from "./stay-cards";
import { ArrowRight } from "./icons";
import { useMotionPreference } from "./motion-provider";

type ZoneFilter = "all" | "poolside" | "timber" | "hotel";

interface StayEditorialProps {
  rooms: RoomCategory[];
}

/**
 * Reusable Parallax Viewport adhering to Emil Kowalski animation principles:
 * Animates compositor-only properties (`transform` y and subtle scale) within an overflow:hidden frame.
 */
function ParallaxCardMedia({
  src,
  alt,
  sizes,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Parallax delta: gentle vertical shift as card traverses viewport
  const y = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["-5%", "5%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [1, 1, 1] : [1.05, 1.01, 1.05]);

  return (
    <div ref={containerRef} className="parallax-viewport">
      <motion.div
        className="parallax-layer"
        style={{ y, scale }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={className}
        />
      </motion.div>
    </div>
  );
}

export default function StayEditorial({ rooms }: StayEditorialProps) {
  const reduced = useMotionPreference();
  const [ambientMood, setAmbientMood] = useState<"twilight" | "daylight">("twilight");
  const [activeZone, setActiveZone] = useState<ZoneFilter>("all");
  const [activeChapterLabel, setActiveChapterLabel] = useState<string>("01 · Signature Living");

  // Perspective angle state for each room category showcase
  const [poolsideIdx, setPoolsideIdx] = useState(0);
  const [suiteIdx, setSuiteIdx] = useState(0);
  const [cottageIdx, setCottageIdx] = useState(0);
  const [dormIdx, setDormIdx] = useState(0);
  const [queenIdx, setQueenIdx] = useState(0);
  const [twinIdx, setTwinIdx] = useState(0);

  // Match room data safely by slug
  const poolsideRoom = rooms.find((r) => r.slug === "poolside-cottage") || rooms[5];
  const suiteRoom = rooms.find((r) => r.slug === "suite") || rooms[2];
  const cottageRoom = rooms.find((r) => r.slug === "wooden-cottage") || rooms[3];
  const dormRoom = rooms.find((r) => r.slug === "dormitory-cottage") || rooms[4];
  const queenRoom = rooms.find((r) => r.slug === "premium-queen") || rooms[0];
  const twinRoom = rooms.find((r) => r.slug === "premium-twin") || rooms[1];

  // Hero Parallax Scroll Tracking
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroParallaxY = useTransform(heroScrollProgress, [0, 1], reduced ? ["0%", "0%"] : ["0%", "24%"]);
  const heroContentY = useTransform(heroScrollProgress, [0, 1], reduced ? ["0%", "0%"] : ["0%", "-12%"]);
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.8, 1], [1, 0.9, 0.4]);

  // Track overall page scroll to update active chapter indicator
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest < 650) {
      setActiveChapterLabel("01 · Signature Living");
    } else if (latest < 1350) {
      setActiveChapterLabel("02 · Master Suites & Cottages");
    } else {
      setActiveChapterLabel("03 · Retreats & Executive Wings");
    }
  });

  // Ambient Hero Scenes
  const twilightScene = getScene("cottage-entry-p32");
  const daylightScene = getScene("hero-pool-day-desktop-p37");
  const currentHeroScene = ambientMood === "twilight" ? twilightScene : daylightScene;

  // Filter conditions
  const showPoolside = activeZone === "all" || activeZone === "poolside";
  const showTimber = activeZone === "all" || activeZone === "timber";
  const showHotel = activeZone === "all" || activeZone === "hotel";

  // Spring transition configs
  const springConfig = { type: "spring" as const, stiffness: 420, damping: 30 };
  const smoothEase = [0.22, 1, 0.36, 1] as const;

  return (
    <div className="stay-editorial-wrap">
      {/* ====================================================================
          1. HERO ATMOSPHERE: Cinematic Resort Entrance with Parallax Scroll
          ==================================================================== */}
      <section ref={heroRef} className="stay-hero" aria-label="Accommodations Overview">
        <div className="stay-hero-media">
          <motion.div
            className="stay-hero-parallax-box"
            style={{ y: heroParallaxY, opacity: heroOpacity }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={ambientMood}
                initial={reduced ? false : { opacity: 0.35, scale: 1.02 }}
                animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0.35, scale: 0.99 }}
                transition={{ duration: 0.45, ease: smoothEase }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              >
                <Image
                  src={currentHeroScene.src}
                  alt={ambientMood === "twilight" ? "Wooden cottage porch and stone garden walkway at twilight" : "Resort infinity pool and colonnade under natural daylight"}
                  fill
                  priority
                  sizes="(max-width: 1440px) 100vw, 1360px"
                  className="stay-hero-img"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="stay-hero-scrim" />

          {/* Top Bar: Coordinates & Ambient Lighting Toggle */}
          <div className="stay-hero-top">
            <div className="stay-hero-badge">
              <span className="stay-hero-pulse" aria-hidden="true" />
              <span>16.3475° N, 75.6259° E · Biligi Ridge</span>
            </div>

            <div className="stay-mood-toggle" role="radiogroup" aria-label="Ambient lighting perspective">
              <button
                type="button"
                className={`stay-mood-btn ${ambientMood === "twilight" ? "is-active" : ""}`}
                onClick={() => setAmbientMood("twilight")}
                role="radio"
                aria-checked={ambientMood === "twilight"}
              >
                {ambientMood === "twilight" && (
                  <motion.span
                    layoutId="stay-hero-mood-pill"
                    className="stay-mood-pill"
                    transition={springConfig}
                  />
                )}
                <span>Dusk Glow</span>
              </button>

              <button
                type="button"
                className={`stay-mood-btn ${ambientMood === "daylight" ? "is-active" : ""}`}
                onClick={() => setAmbientMood("daylight")}
                role="radio"
                aria-checked={ambientMood === "daylight"}
              >
                {ambientMood === "daylight" && (
                  <motion.span
                    layoutId="stay-hero-mood-pill"
                    className="stay-mood-pill"
                    transition={springConfig}
                  />
                )}
                <span>Sunlit Day</span>
              </button>
            </div>
          </div>

          {/* Bottom Content: Typology Header & Scannable Facts with Parallax Lift */}
          <motion.div className="stay-hero-content" style={{ y: heroContentY }}>
            <span className="stay-hero-kicker">Accommodations & Residences</span>
            <h1 className="stay-hero-title">Rooms, cottages & private pool villas</h1>
            <p className="stay-hero-line">
              Six bespoke architectural typologies across Hotel Block 1, the Timber Wellness Enclave, and the Poolside Courtyard.
            </p>

            <div className="stay-hero-stats">
              <div className="stay-stat-item">
                <span className="stay-stat-val">6</span>
                <span className="stay-stat-lbl">Typologies</span>
              </div>
              <div className="stay-stat-item">
                <span className="stay-stat-val">₹4,999</span>
                <span className="stay-stat-lbl">From, a night</span>
              </div>
              <div className="stay-stat-item">
                <span className="stay-stat-val">3</span>
                <span className="stay-stat-lbl">Landscape Zones</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====================================================================
          2. STICKY GLASS ZONE FILTER BAR (Scroll-Persistent Navigation)
          ==================================================================== */}
      <nav className="stay-filter-bar" aria-label="Filter accommodation categories by zone">
        <div className="stay-filter-pills" role="tablist">
          <button
            type="button"
            className={`stay-filter-btn ${activeZone === "all" ? "is-active" : ""}`}
            onClick={() => setActiveZone("all")}
            role="tab"
            aria-selected={activeZone === "all"}
          >
            {activeZone === "all" && (
              <motion.span
                layoutId="activeZonePill"
                className="stay-filter-pill-bg"
                transition={springConfig}
              />
            )}
            <span>All Sanctuaries</span>
            <span className="stay-filter-count">6</span>
          </button>

          <button
            type="button"
            className={`stay-filter-btn ${activeZone === "poolside" ? "is-active" : ""}`}
            onClick={() => setActiveZone("poolside")}
            role="tab"
            aria-selected={activeZone === "poolside"}
          >
            {activeZone === "poolside" && (
              <motion.span
                layoutId="activeZonePill"
                className="stay-filter-pill-bg"
                transition={springConfig}
              />
            )}
            <span>Poolside Courtyard</span>
            <span className="stay-filter-count">1</span>
          </button>

          <button
            type="button"
            className={`stay-filter-btn ${activeZone === "timber" ? "is-active" : ""}`}
            onClick={() => setActiveZone("timber")}
            role="tab"
            aria-selected={activeZone === "timber"}
          >
            {activeZone === "timber" && (
              <motion.span
                layoutId="activeZonePill"
                className="stay-filter-pill-bg"
                transition={springConfig}
              />
            )}
            <span>Timber Wellness Enclave</span>
            <span className="stay-filter-count">2</span>
          </button>

          <button
            type="button"
            className={`stay-filter-btn ${activeZone === "hotel" ? "is-active" : ""}`}
            onClick={() => setActiveZone("hotel")}
            role="tab"
            aria-selected={activeZone === "hotel"}
          >
            {activeZone === "hotel" && (
              <motion.span
                layoutId="activeZonePill"
                className="stay-filter-pill-bg"
                transition={springConfig}
              />
            )}
            <span>Hotel Block 1</span>
            <span className="stay-filter-count">3</span>
          </button>
        </div>

        {/* Live Scroll Chapter Tracker */}
        <div className="stay-filter-indicator">
          <span className="stay-filter-dot" aria-hidden="true" />
          <span>{activeChapterLabel}</span>
        </div>
      </nav>

      {/* ====================================================================
          3. CHAPTER 1: THE CROWN VILLA (Poolside Cottage — Full-Bleed Showcase)
          ==================================================================== */}
      {showPoolside && poolsideRoom && (
        <motion.section
          id="chapter-poolside"
          className="stay-section"
          aria-labelledby="flagship-title"
          initial={reduced ? false : { opacity: 0, y: 36 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.6, ease: smoothEase }}
        >
          <div className="stay-chapter-header">
            <div className="stay-chapter-left">
              <span className="stay-chapter-kicker">01 · Signature Living</span>
              <h2 id="flagship-title" className="stay-chapter-title">The Poolside Enclave</h2>
            </div>
            <span className="stay-chapter-tag">Waterfront Privileges · Pet-Friendly</span>
          </div>

          <article className="flagship-card">
            <div className="flagship-grid">
              {/* Media with In-Frame Parallax & Perspective Switcher */}
              <div className="flagship-media-wrap">
                {(() => {
                  const currentImage = poolsideRoom.images[poolsideIdx] || poolsideRoom.images[0];
                  const scene = getScene(currentImage.sceneId);
                  return (
                    <ParallaxCardMedia
                      key={currentImage.sceneId}
                      src={scene.src}
                      alt={currentImage.alt}
                      sizes="(max-width: 980px) 100vw, 60vw"
                    />
                  );
                })()}

                <div className="flagship-overlay-badge">
                  <span>View {poolsideIdx + 1} of {poolsideRoom.images.length} · {poolsideRoom.images[poolsideIdx]?.label}</span>
                </div>

                <div className="flagship-angles" role="group" aria-label="Perspective angles for Poolside Cottage">
                  {poolsideRoom.images.map((img, i) => (
                    <button
                      key={img.sceneId}
                      type="button"
                      className={`flagship-angle-btn ${poolsideIdx === i ? "is-active" : ""}`}
                      onClick={() => setPoolsideIdx(i)}
                      aria-label={`View ${img.label}`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Content */}
              <div className="flagship-body">
                <div className="flagship-meta-top">
                  <span className="flagship-zone">{poolsideRoom.zone}</span>
                  <h3 className="flagship-title">
                    <Link href={`/stay/${poolsideRoom.slug}`}>{poolsideRoom.title}</Link>
                  </h3>
                  <p className="flagship-lead">{poolsideRoom.lead}</p>

                  <div className="flagship-features">
                    {poolsideRoom.features.slice(0, 3).map((feat) => (
                      <span key={feat.title} className="flagship-feat-pill">
                        {feat.title}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flagship-footer">
                  <div className="flagship-price">
                    <span className="flagship-price-val">{poolsideRoom.startingTariff}</span>
                    <span className="flagship-price-sub">{poolsideRoom.tariffUnit || "/ night"} · {poolsideRoom.taxNote || "Excl. 12% GST"}</span>
                  </div>

                  <Link href={`/stay/${poolsideRoom.slug}`} className="flagship-cta">
                    <span>Explore Villa</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </motion.section>
      )}

      {/* ====================================================================
          4. CHAPTER 2: THE ARCHITECTURAL DUET (Asymmetric 60/40 Split)
          Suite Room with Jacuzzi (60%) vs Standalone Wooden Cottage (40%)
          ==================================================================== */}
      {(showHotel || showTimber) && (
        <motion.section
          id="chapter-suites"
          className="stay-section"
          aria-labelledby="duet-title"
          initial={reduced ? false : { opacity: 0, y: 36 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.6, ease: smoothEase }}
        >
          <div className="stay-chapter-header">
            <div className="stay-chapter-left">
              <span className="stay-chapter-kicker">02 · Distinct Perspectives</span>
              <h2 id="duet-title" className="stay-chapter-title">Master Suites & Timber Enclaves</h2>
            </div>
            <span className="stay-chapter-tag">Jacuzzi Whirlpools · Natural Treated Rafters</span>
          </div>

          <div className="editorial-duet-grid">
            {/* Card A: Suite Room with Jacuzzi (60% Width) */}
            {showHotel && suiteRoom && (
              <motion.article
                className="duet-card"
                initial={reduced ? false : { opacity: 0, y: 28 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, ease: smoothEase }}
              >
                <div className="duet-media">
                  {(() => {
                    const img = suiteRoom.images[suiteIdx] || suiteRoom.images[0];
                    const scene = getScene(img.sceneId);
                    return (
                      <ParallaxCardMedia
                        key={img.sceneId}
                        src={scene.src}
                        alt={img.alt}
                        sizes="(max-width: 940px) 100vw, 55vw"
                      />
                    );
                  })()}

                  <div className="duet-angles" role="group" aria-label="Perspective angles for Suite Room">
                    {suiteRoom.images.slice(0, 4).map((img, i) => (
                      <button
                        key={img.sceneId}
                        type="button"
                        className={`duet-angle-pill ${suiteIdx === i ? "is-active" : ""}`}
                        onClick={() => setSuiteIdx(i)}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="duet-body">
                  <div>
                    <span className="duet-zone">{suiteRoom.zone} · In-Room Jacuzzi</span>
                    <h3 className="duet-name">
                      <Link href={`/stay/${suiteRoom.slug}`}>{suiteRoom.title}</Link>
                    </h3>
                    <div className="duet-feats">
                      {suiteRoom.features.slice(0, 3).map((f) => (
                        <span key={f.title} className="duet-feat-tag">{f.title}</span>
                      ))}
                    </div>
                  </div>

                  <div className="duet-footer">
                    <span className="duet-price">
                      <strong>{suiteRoom.startingTariff}</strong> night
                    </span>
                    <Link href={`/stay/${suiteRoom.slug}`} className="duet-cta-link">
                      <span>Explore Suite</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )}

            {/* Card B: Standalone Wooden Cottage (40% Width) */}
            {showTimber && cottageRoom && (
              <motion.article
                className="duet-card duet-card-tall"
                initial={reduced ? false : { opacity: 0, y: 28 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: reduced ? 0 : 0.08, ease: smoothEase }}
              >
                <div className="duet-media">
                  {(() => {
                    const img = cottageRoom.images[cottageIdx] || cottageRoom.images[0];
                    const scene = getScene(img.sceneId);
                    return (
                      <ParallaxCardMedia
                        key={img.sceneId}
                        src={scene.src}
                        alt={img.alt}
                        sizes="(max-width: 940px) 100vw, 45vw"
                      />
                    );
                  })()}

                  <div className="duet-angles" role="group" aria-label="Perspective angles for Wooden Cottage">
                    {cottageRoom.images.map((img, i) => (
                      <button
                        key={img.sceneId}
                        type="button"
                        className={`duet-angle-pill ${cottageIdx === i ? "is-active" : ""}`}
                        onClick={() => setCottageIdx(i)}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="duet-body">
                  <div>
                    <span className="duet-zone">{cottageRoom.zone}</span>
                    <h3 className="duet-name">
                      <Link href={`/stay/${cottageRoom.slug}`}>{cottageRoom.title}</Link>
                    </h3>
                    <div className="duet-feats">
                      {cottageRoom.features.slice(0, 3).map((f) => (
                        <span key={f.title} className="duet-feat-tag">{f.title}</span>
                      ))}
                    </div>
                  </div>

                  <div className="duet-footer">
                    <span className="duet-price">
                      <strong>{cottageRoom.startingTariff}</strong> night
                    </span>
                    <Link href={`/stay/${cottageRoom.slug}`} className="duet-cta-link">
                      <span>Explore Cottage</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )}
          </div>
        </motion.section>
      )}

      {/* ====================================================================
          5. CHAPTER 3: THE COLLECTIVE RETREAT & EXECUTIVE WING (Tactile Trio)
          Dormitory Cottage + Premium Queen + Premium Twin
          ==================================================================== */}
      {(showTimber || showHotel) && (
        <motion.section
          id="chapter-retreats"
          className="stay-section"
          aria-labelledby="trio-title"
          initial={reduced ? false : { opacity: 0, y: 36 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.6, ease: smoothEase }}
        >
          <div className="stay-chapter-header">
            <div className="stay-chapter-left">
              <span className="stay-chapter-kicker">03 · Collective & Executive Wings</span>
              <h2 id="trio-title" className="stay-chapter-title">Retreats & Executive Rooms</h2>
            </div>
            <span className="stay-chapter-tag">Group Excursions · Corporate Ergonomics</span>
          </div>

          <div className="editorial-trio-grid">
            {/* Card C: Dormitory Cottage (10-12 Guests) */}
            {showTimber && dormRoom && (
              <motion.article
                className="trio-card"
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, ease: smoothEase }}
              >
                <div className="trio-media">
                  {(() => {
                    const img = dormRoom.images[dormIdx] || dormRoom.images[0];
                    const scene = getScene(img.sceneId);
                    return (
                      <ParallaxCardMedia
                        key={img.sceneId}
                        src={scene.src}
                        alt={img.alt}
                        sizes="(max-width: 900px) 100vw, 33vw"
                      />
                    );
                  })()}

                  <div className="trio-angles" role="group" aria-label="Perspective angles for Dormitory Cottage">
                    {dormRoom.images.map((img, i) => (
                      <button
                        key={img.sceneId}
                        type="button"
                        className={`trio-angle-pill ${dormIdx === i ? "is-active" : ""}`}
                        onClick={() => setDormIdx(i)}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="trio-body">
                  <div>
                    <span className="trio-zone">{dormRoom.zone} · 10–12 Guests</span>
                    <h3 className="trio-name">
                      <Link href={`/stay/${dormRoom.slug}`}>{dormRoom.title}</Link>
                    </h3>
                    <div className="trio-feats">
                      {dormRoom.features.slice(0, 2).map((f) => (
                        <span key={f.title} className="trio-feat-tag">{f.title}</span>
                      ))}
                    </div>
                  </div>

                  <div className="trio-footer">
                    <span className="trio-price">
                      <strong>{dormRoom.startingTariff}</strong> unit
                    </span>
                    <Link href={`/stay/${dormRoom.slug}`} className="trio-cta-link">
                      <span>Explore</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )}

            {/* Card D: Premium Room — Queen */}
            {showHotel && queenRoom && (
              <motion.article
                className="trio-card"
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: reduced ? 0 : 0.08, ease: smoothEase }}
              >
                <div className="trio-media">
                  {(() => {
                    const img = queenRoom.images[queenIdx] || queenRoom.images[0];
                    const scene = getScene(img.sceneId);
                    return (
                      <ParallaxCardMedia
                        key={img.sceneId}
                        src={scene.src}
                        alt={img.alt}
                        sizes="(max-width: 900px) 100vw, 33vw"
                      />
                    );
                  })()}

                  <div className="trio-angles" role="group" aria-label="Perspective angles for Queen Room">
                    {queenRoom.images.slice(0, 3).map((img, i) => (
                      <button
                        key={img.sceneId}
                        type="button"
                        className={`trio-angle-pill ${queenIdx === i ? "is-active" : ""}`}
                        onClick={() => setQueenIdx(i)}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="trio-body">
                  <div>
                    <span className="trio-zone">{queenRoom.zone}</span>
                    <h3 className="trio-name">
                      <Link href={`/stay/${queenRoom.slug}`}>{queenRoom.title}</Link>
                    </h3>
                    <div className="trio-feats">
                      {queenRoom.features.slice(0, 2).map((f) => (
                        <span key={f.title} className="trio-feat-tag">{f.title}</span>
                      ))}
                    </div>
                  </div>

                  <div className="trio-footer">
                    <span className="trio-price">
                      <strong>{queenRoom.startingTariff}</strong> night
                    </span>
                    <Link href={`/stay/${queenRoom.slug}`} className="trio-cta-link">
                      <span>Explore</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )}

            {/* Card E: Premium Room — Twin */}
            {showHotel && twinRoom && (
              <motion.article
                className="trio-card"
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: reduced ? 0 : 0.16, ease: smoothEase }}
              >
                <div className="trio-media">
                  {(() => {
                    const img = twinRoom.images[twinIdx] || twinRoom.images[0];
                    const scene = getScene(img.sceneId);
                    return (
                      <ParallaxCardMedia
                        key={img.sceneId}
                        src={scene.src}
                        alt={img.alt}
                        sizes="(max-width: 900px) 100vw, 33vw"
                      />
                    );
                  })()}

                  <div className="trio-angles" role="group" aria-label="Perspective angles for Twin Room">
                    {twinRoom.images.slice(0, 3).map((img, i) => (
                      <button
                        key={img.sceneId}
                        type="button"
                        className={`trio-angle-pill ${twinIdx === i ? "is-active" : ""}`}
                        onClick={() => setTwinIdx(i)}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="trio-body">
                  <div>
                    <span className="trio-zone">{twinRoom.zone}</span>
                    <h3 className="trio-name">
                      <Link href={`/stay/${twinRoom.slug}`}>{twinRoom.title}</Link>
                    </h3>
                    <div className="trio-feats">
                      {twinRoom.features.slice(0, 2).map((f) => (
                        <span key={f.title} className="trio-feat-tag">{f.title}</span>
                      ))}
                    </div>
                  </div>

                  <div className="trio-footer">
                    <span className="trio-price">
                      <strong>{twinRoom.startingTariff}</strong> night
                    </span>
                    <Link href={`/stay/${twinRoom.slug}`} className="trio-cta-link">
                      <span>Explore</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )}
          </div>
        </motion.section>
      )}

      {/* Editorial Footnote */}
      <footer className="stay-footnote">
        <p>{impression} Finishes, architectural layout and room appointments subject to final pre-opening certification.</p>
      </footer>
    </div>
  );
}
