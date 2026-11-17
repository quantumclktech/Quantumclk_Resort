// Hash routes: "#<module>[/<sub>[/<id>]]", e.g. #employees/performance/rohan (D-137).
import { useEffect, useState } from "react";

/** The current hash without "#", split on "/" (empty parts dropped). */
export function useRoute(): string[] {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const on = () => setHash(window.location.hash.slice(1));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash.split("/").filter(Boolean).map(decodeURIComponent);
}

export function navigate(...parts: string[]) {
  window.location.hash = parts.map(encodeURIComponent).join("/");
}
