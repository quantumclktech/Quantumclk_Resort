"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionPreference } from "./motion-provider";

/* A figure that counts up once, the first time it is scrolled into view
 * (unit 3.19). The point is to show the size of the number, so it only runs
 * where the number is the message, and never under reduced motion. */

export default function CountUp({ to, suffix = "", duration = 1100 }: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const reduced = useMotionPreference();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(to);
  const started = useRef(false);

  useEffect(() => {
    if (reduced || !ref.current || !("IntersectionObserver" in window)) return;
    // Start from zero only once we know motion is wanted, so the server-rendered
    // markup already carries the final number for search engines and no-JS.
    if (!started.current) setShown(0);

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      const from = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - from) / duration);
        // ease-out, so it settles rather than stops dead
        setShown(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, duration, reduced]);

  return <span ref={ref}>{shown.toLocaleString("en-IN")}{suffix}</span>;
}
