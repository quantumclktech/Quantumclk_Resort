"use client";

import Image from "next/image";
import { motion, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMotionPreference } from "./motion-provider";
import { impression, type Scene } from "./resort-assets";
import { ArrowDown, ArrowLeft, ArrowRight } from "./icons";

export type HeroSlide = {
  scene: Scene; mobile?: Scene; title: string; label: string; alt: string;
  focalPoint: string; mobileFocalPoint: string;
};

/** Long enough to read a line and look at the scene before it moves on. */
const SLIDE_DURATION = 7000;

export default function AnimatedHero({ slides, ready, revealed, revealOpacity, revealY, imageScale }: {
  slides: HeroSlide[]; ready: boolean; revealed: boolean; revealOpacity: MotionValue<number>; revealY: MotionValue<number>; imageScale: MotionValue<number>;
}) {
  const reduced = useMotionPreference();
  const [index, setIndex] = useState(0);
  /* Taking control by hand ends the rotation for good — it should never wrest
   * the slide back from someone who is reading it. */
  const [taken, setTaken] = useState(false);
  const [paused, setPaused] = useState(false);
  const region = useRef<HTMLElement>(null);
  const slide = slides[index];
  const isGallery = slides.length > 1;

  function change(direction: number) {
    setIndex(value => (value + direction + slides.length) % slides.length);
  }

  /** Prev/next, and anything else a person drives. */
  function take(direction: number) {
    setTaken(true);
    change(direction);
  }

  /* True while the hero is rotating on its own. The position readout only
   * announces once a person is driving: a live region that fires on every
   * automatic change talks over whatever a screen reader is already reading. */
  const rotating = isGallery && !reduced && !taken;

  // Advance on its own only while the hero is on screen, visible, settled, and
  // nobody is hovering, reading with the keyboard, or has taken over.
  useEffect(() => {
    if (!isGallery || reduced || taken || paused || !revealed) return;

    let timer = 0;
    const start = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => change(1), SLIDE_DURATION);
    };
    const onVisibility = () => {
      if (document.hidden) window.clearTimeout(timer);
      else start();
    };

    // A hero scrolled out of view should not be burning through its slides.
    const el = region.current;
    let observer: IntersectionObserver | undefined;
    if (el && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting && !document.hidden ? start() : window.clearTimeout(timer)),
        { threshold: 0.35 },
      );
      observer.observe(el);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // index is a dependency so each slide restarts the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isGallery, reduced, taken, paused, revealed, slides.length]);

  return (
    <section
      ref={region}
      className="hero opening-slideshow"
      aria-label={isGallery ? "Golden Hills resort design concepts" : "Golden Hills Resort"}
      aria-roledescription={isGallery ? "carousel" : undefined}
      inert={ready && !revealed}
      onPointerEnter={isGallery ? () => setPaused(true) : undefined}
      onPointerLeave={isGallery ? () => setPaused(false) : undefined}
      onFocusCapture={isGallery ? () => setPaused(true) : undefined}
      onBlurCapture={isGallery ? () => setPaused(false) : undefined}
    >
      <figure className="hero-figure">
        <div className="hero-window" id="hero-slides">
          {slides.map((item, position) => (
            <motion.div key={item.scene.src} className={`hero-slide hero-slide-${position}`} initial={false}
              animate={{ opacity: index === position ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden={index !== position}
              style={{ "--slide-focal": item.focalPoint, "--slide-mobile-focal": item.mobileFocalPoint } as CSSProperties}>
              <motion.div className="hero-media" style={{ scale: imageScale }}><picture>
                {item.mobile && <source media="(max-width: 999px)" srcSet={item.mobile.src} />}
                {/* Every slide sits in the viewport from the start, so the later
                  * ones are dropped down the queue rather than racing the first
                  * one, which is the page's largest contentful paint. */}
                <Image
                  {...item.scene}
                  sizes="100vw"
                  preload={position === 0}
                  fetchPriority={position === 0 ? "high" : "low"}
                  alt={item.alt}
                />
              </picture></motion.div>
            </motion.div>
          ))}
          <div className="hero-shade" aria-hidden="true" />
        </div>
        <figcaption className="hero-disclosure"><span>{slide.label}</span><span>{impression}</span></figcaption>
      </figure>

      <motion.div className="hero-heading" style={ready ? { opacity: revealOpacity, y: revealY } : undefined}>
        <p className="hero-status">Stay · Dine · Gather</p>
        {/* Not a live region: the position readout below already announces the
          * slide and its title, and two regions would talk over each other. */}
        <motion.h1 id="hero-title" key={index} initial={reduced ? false : { opacity: 0.6, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}>{slide.title}</motion.h1>
      </motion.div>

      <motion.div className="hero-bottom" style={ready ? { opacity: revealOpacity, y: revealY } : undefined}>
        <a className="explore-button" href="#stay">Explore stays &amp; experiences <ArrowDown size={16} /></a>
        <a className="hero-secondary-link" href="#gatherings">Plan a gathering <ArrowRight size={16} /></a>
      </motion.div>

      {isGallery && <motion.div className="slideshow-controls" hidden={!ready} style={ready ? { opacity: revealOpacity } : undefined} onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          take(event.key === "ArrowRight" ? 1 : -1);
        }
      }}>
        <div className="slide-navigation">
          <button type="button" aria-label="Previous concept" aria-controls="hero-slides" onClick={() => take(-1)}><ArrowLeft size={18} /></button>
          <span className="slide-position" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
            <span className="visually-hidden">Concept </span>{index + 1}<span aria-hidden="true"> / </span><span className="visually-hidden"> of </span>{slides.length}<span className="visually-hidden">. {slide.title}</span>
          </span>
          <button type="button" aria-label="Next concept" aria-controls="hero-slides" onClick={() => take(1)}><ArrowRight size={18} /></button>
        </div>
      </motion.div>}
    </section>
  );
}
