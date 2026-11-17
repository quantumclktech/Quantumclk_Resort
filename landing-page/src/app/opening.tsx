"use client";

import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import AnimatedHero from "./animated-hero";
import SiteHeader from "./site-header";
import { logo, logoLight } from "./resort-assets";
import { useMotionPreference } from "./motion-provider";
import { ArrowDown } from "./icons";
import type { HeroSlide } from "./animated-hero";

export default function Opening({ slides }: { slides: HeroSlide[] }) {
  const root = useRef<HTMLDivElement>(null);
  const logoLink = useRef<HTMLAnchorElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const reduced = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: root, offset: ["start start", "end end"] });
  const travel = useMotionValue(0);
  const travelX = useMotionValue(0);
  const smallScale = useMotionValue(1);
  const progress = useTransform(() => {
    // The final part of the sticky range is intentionally settled, giving the
    // complete opening breathing room before reverse scrolling restarts it.
    const p = Math.max(0, Math.min(1, scrollYProgress.get() / 0.72));
    return reduced ? 1 : p * p * (3 - 2 * p);
  });
  const x = useTransform(() => travelX.get() * progress.get());
  const y = useTransform(() => travel.get() * progress.get());
  const scale = useTransform(() => 1 + (smallScale.get() - 1) * progress.get());
  const transform = useMotionTemplate`translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
  const chrome = useTransform(progress, [0, 0.64, 0.88, 1], [0, 0, 1, 1]);
  const lightLogo = useTransform(progress, [0, 0.62, 0.78, 1], [1, 1, 0, 0]);
  const darkLogo = useTransform(progress, [0, 0.62, 0.78, 1], [0, 0, 1, 1]);
  const cue = useTransform(progress, [0, 0.12, 0.3, 1], [1, 1, 0, 0]);
  const heroClip = useTransform(progress, [0, 0.14, 0.26, 0.72, 1], [
    "inset(50% 50% 50% 50% round 50% 50% 0% 0%)",
    "inset(50% 50% 50% 50% round 50% 50% 0% 0%)",
    "inset(48% 44% 48% 44% round 50% 50% 0% 0%)",
    "inset(0% 0% 0% 0% round 0% 0% 0% 0%)",
    "inset(0% 0% 0% 0% round 0% 0% 0% 0%)",
  ]);
  const heroCopy = useTransform(progress, [0, 0.8, 0.93, 1], [0, 0, 1, 1]);
  const heroCopyY = useTransform(progress, [0, 0.8, 0.93, 1], [12, 12, 0, 0]);
  const heroScale = useTransform(progress, [0, 0.16, 0.92, 1], [1.04, 1.04, 1, 1]);
  const settled = reduced || revealed;

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const done = value >= 0.72;
    setRevealed((previous) => (previous === done ? previous : done));
  });

  useEffect(() => {
    let frame = 0;
    function measure() {
      const el = root.current;
      const anchor = logoLink.current;
      if (!el || !anchor) return;
      const css = getComputedStyle(el);
      // The intro ruler is always exactly 100svh, even before enhancement.
      const height = el.querySelector<HTMLElement>(".opening-ruler")!.offsetHeight;

      const header = parseFloat(css.getPropertyValue("--opening-masthead-height")) || 84;
      const finalWidth = parseFloat(css.getPropertyValue("--opening-nav-logo-width")) || 136;
      const anchorWidth = parseFloat(getComputedStyle(anchor).width) || 620;

      // Vertical travel: exact constant from center of hero (height / 2) to center of header (header / 2)
      travel.set((header - height) / 2);

      const target = el.querySelector<HTMLElement>(".site-navbar-logo-slot");
      if (target) {
        const targetRect = target.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const currentCenterX = window.innerWidth / 2;
        travelX.set(targetCenterX - currentCenterX);
        smallScale.set((targetRect.width || finalWidth) / anchorWidth);
      } else {
        const gutter = 32;
        const targetCenterX = gutter + finalWidth / 2;
        const currentCenterX = window.innerWidth / 2;
        travelX.set(targetCenterX - currentCenterX);
        smallScale.set(finalWidth / anchorWidth);
      }

      const rect = el.getBoundingClientRect();
      const distance = Math.max(1, el.offsetHeight - height);
      scrollYProgress.jump(Math.max(0, Math.min(1, -rect.top / distance)));
    }
    frame = requestAnimationFrame(() => {
      measure();
      setEnhanced(true);
    });
    const observer = new ResizeObserver(measure);
    if (root.current) observer.observe(root.current);
    window.addEventListener("pageshow", measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pageshow", measure);
      window.removeEventListener("resize", measure);
    };
  }, [scrollYProgress, smallScale, travel, travelX]);

  return (
    <div
      id="top"
      ref={root}
      className="opening"
      data-enhanced={enhanced || undefined}
      data-revealed={settled || undefined}
      data-reduced={reduced || undefined}
    >
      <div className="opening-ruler" aria-hidden="true" />
      <div id="opening-hero" className="opening-target" aria-hidden="true" />
      <div className="opening-stage">
        <motion.div className="opening-hero-reveal" style={enhanced ? { clipPath: heroClip } : undefined}>
          <AnimatedHero
            slides={slides}
            ready={enhanced}
            revealed={settled}
            revealOpacity={heroCopy}
            revealY={heroCopyY}
            imageScale={heroScale}
          />
        </motion.div>
        <motion.div className="opening-intro-meta" style={enhanced ? { opacity: cue } : undefined} aria-hidden="true">
          <span>Golden Hills Resort</span>
          <span>Stay · Dine · Gather</span>
        </motion.div>
        <motion.a
          className="opening-cue"
          href="#opening-hero"
          tabIndex={enhanced && settled ? -1 : 0}
          aria-hidden={(enhanced && settled) || undefined}
          style={enhanced ? { opacity: cue } : undefined}
        >
          Scroll to explore <ArrowDown size={16} />
        </motion.a>
      </div>
      <SiteHeader enhanced={enhanced} revealed={settled} chrome={chrome}>
        <motion.a
          ref={logoLink}
          className="opening-logo"
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
          }}
          aria-label="Golden Hills Resort, return to top"
          style={enhanced ? { transform } : undefined}
        >
          <span className="opening-logo-lockup">
            <motion.span className="opening-logo-layer opening-logo-light" style={enhanced ? { opacity: lightLogo } : undefined}>
              <Image
                src={logoLight}
                alt="Golden Hills Resort"
                width={2360}
                height={1120}
                preload
                sizes="(max-width: 700px) 80vw, 620px"
              />
            </motion.span>
            <motion.span
              className="opening-logo-layer opening-logo-dark"
              style={enhanced ? { opacity: darkLogo } : undefined}
              aria-hidden="true"
            >
              <Image src={logo} alt="" width={2360} height={1120} sizes="(max-width: 700px) 80vw, 620px" />
            </motion.span>
          </span>
        </motion.a>
      </SiteHeader>
    </div>
  );
}
