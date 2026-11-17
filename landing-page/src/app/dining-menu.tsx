"use client";

import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { DiningOutlet } from "./dining-cards";
import { hoursLabel } from "./dining-hours";
import { getScene } from "./resort-assets";
import { ArrowUpRight, XIcon } from "./icons";

/* The menu panel (unit 3.21). One sheet for the whole page, opened from the
 * index at the top or from any outlet's section. It shows the outlet's real
 * menu file once one is set in dining-data.ts (`menuFile`, PDF or image);
 * until then it shows the grouped preview cut from the outlet's own copy and
 * says plainly that the full menu is still to come.
 *
 * Motion: the sheet slides in from the right (from the bottom on phones),
 * 320ms on the codebase ease-out, and leaves the same way. It is a CSS
 * transition on an always-mounted element, so a quick open-close retargets
 * instead of jumping. Reduced motion: opacity only. */

type MenuApi = { open: (index: number, from: HTMLElement) => void };
const MenuContext = createContext<MenuApi>({ open: () => {} });

export function MenuButton({ index, name, className = "" }: { index: number; name: string; className?: string }) {
  const { open } = useContext(MenuContext);
  return (
    <button
      type="button"
      className={`dmenu-btn ${className}`}
      onClick={(e) => open(index, e.currentTarget)}
      aria-haspopup="dialog"
      aria-label={`View menu, ${name}`}
    >
      View menu
    </button>
  );
}

export default function DiningMenu({ outlets, children }: { outlets: DiningOutlet[]; children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [isOpen, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const open = useCallback((i: number, from: HTMLElement) => {
    opener.current = from;
    setIndex(i);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    closeBtn.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "Tab" && sheet.current) {
        const items = sheet.current.querySelectorAll<HTMLElement>("button, a[href], iframe");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const outlet = outlets[index];
  const file = outlet.menuFile;
  const isPdf = file?.toLowerCase().endsWith(".pdf");

  return (
    <MenuContext.Provider value={{ open }}>
      {children}

      <div className={`dmenu${isOpen ? " is-open" : ""}`} inert={!isOpen}>
        <div className="dmenu-scrim" onClick={close} aria-hidden="true" />
        <div
          className="dmenu-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dmenu-title"
          ref={sheet}
        >
          <header className="dmenu-head">
            <div className="dmenu-photo">
              <Image {...getScene(outlet.sceneId)} alt="" sizes="480px" />
            </div>
            <button type="button" className="dmenu-close" onClick={close} ref={closeBtn} aria-label="Close menu">
              <XIcon size={20} />
            </button>
            <p className="dmenu-kicker">Menu</p>
            <h2 id="dmenu-title">{outlet.name}</h2>
            <p className="dmenu-hours">{hoursLabel(outlet.openWindows)}</p>
          </header>

          <div className="dmenu-body">
            {file ? (
              <>
                {isPdf ? (
                  <iframe className="dmenu-file" src={file} title={`${outlet.name} menu`} />
                ) : (
                  // A supplied menu scan is shown as-is, at its own proportions.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="dmenu-file" src={file} alt={`${outlet.name} menu`} />
                )}
                <a className="dmenu-link" href={file} target="_blank" rel="noreferrer">
                  Open full menu <ArrowUpRight size={16} />
                </a>
              </>
            ) : (
              <>
                {(outlet.menuPreview ?? []).map((group) => (
                  <section key={group.heading} className="dmenu-group">
                    <h3>{group.heading}</h3>
                    <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                ))}
                <p className="dmenu-note">Full menu and prices to follow</p>
              </>
            )}
          </div>
        </div>
      </div>
    </MenuContext.Provider>
  );
}
