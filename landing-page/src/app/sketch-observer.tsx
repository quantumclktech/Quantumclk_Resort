"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* Draws each pencil sketch once, the first time it scrolls into view
 * (unit 3.22). Sketches start visible; only once this runs does the page get
 * .sketch-js, which hides the strokes until they are drawn — so without
 * JavaScript, or with reduced motion, the drawings are simply there.
 * Re-scans on every route change because client navigation brings new
 * sketches without a reload. Sketches marked .sketch-manual are driven by
 * their own component (the opening's side drawings follow scroll progress). */

export default function SketchObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("sketch-js");

    const observer = new IntersectionObserver((records) => {
      for (const r of records) {
        // A share of the drawing, or enough of it in pixels: a large sketch
        // that is cropped (the gatherings lights) never reaches a share.
        const enough = r.intersectionRatio >= 0.35 || r.intersectionRect.height >= 120;
        if (!r.isIntersecting || !enough) continue;
        r.target.classList.add("is-drawn");
        observer.unobserve(r.target);
      }
    }, { threshold: [0.1, 0.2, 0.35] });

    const SELECTOR = ".sketch:not(.is-drawn):not(.sketch-manual)";
    for (const el of document.querySelectorAll(SELECTOR)) observer.observe(el);

    // Sketches that mount after the scan (signed-in views appear once the
    // session loads; panels swap in) would otherwise stay undrawn — hidden
    // strokes, an empty space where the drawing should be.
    const added = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(SELECTOR)) observer.observe(node);
          for (const el of node.querySelectorAll(SELECTOR)) observer.observe(el);
        }
      }
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => { observer.disconnect(); added.disconnect(); };
  }, [pathname]);

  return null;
}
