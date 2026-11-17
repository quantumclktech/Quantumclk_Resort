"use client";

import { useState } from "react";
import { Share } from "./icons";

/** Shares the room page: the device share sheet where there is one, else a copied link. */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} · Golden Hills Resort`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* The person closed the share sheet; nothing to do. */
    }
  }

  return (
    <button type="button" className="room-share" onClick={share}>
      <Share size={16} />
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
