"use client";

import { MotionConfig } from "motion/react";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

const ReducedMotionContext = createContext(true);
const query = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;

export function useMotionPreference() {
  return useContext(ReducedMotionContext);
}

export default function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return (
    <MotionConfig reducedMotion="user">
      <ReducedMotionContext.Provider value={reduced}>
        {children}
      </ReducedMotionContext.Provider>
    </MotionConfig>
  );
}
