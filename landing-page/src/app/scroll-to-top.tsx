"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Ensures that whenever the route changes (e.g. opening any other page),
 * the window and document scroll immediately starts from the absolute top.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (typeof window !== "undefined") {
      // If the URL does not contain an anchor hash, start at the top
      if (!window.location.hash) {
        const html = document.documentElement;
        const prevBehavior = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        html.scrollTop = 0;
        requestAnimationFrame(() => {
          html.style.scrollBehavior = prevBehavior;
        });
      }
    }
  }, [pathname]);

  return null;
}

