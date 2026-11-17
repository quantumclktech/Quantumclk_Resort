"use client";

/* Room page photo grid (unit 3.17). One large render and up to four smaller
 * ones, the layout Airbnb uses; "Show all photos" opens every render at full
 * width. Each render is an artist's impression, and the page says so. */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, XIcon } from "./icons";

export type GalleryImage = { src: string; width: number; height: number; alt: string; label: string };

export default function RoomGallery({ images, note }: { images: GalleryImage[]; note: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  function show(index: number) {
    returnTo.current = document.activeElement as HTMLElement | null;
    setOpen(index);
  }

  const close = useCallback(() => {
    setOpen(null);
    returnTo.current?.focus();
  }, []);

  // While open: lock page scroll, move focus in, jump to the chosen photo,
  // and let Escape close it.
  useEffect(() => {
    if (open === null) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    document.getElementById(`room-photo-${open}`)?.scrollIntoView({ block: "start" });
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const tiles = images.slice(0, 5);

  return (
    <>
      {/* The button sits outside the grid so it stays put when the grid
        * becomes a sideways-scrolling strip on phones. */}
      <div className="room-grid-wrap">
      <div className={`room-grid room-grid-${tiles.length}`}>
        {tiles.map((image, index) => (
          <button
            key={image.src}
            type="button"
            className={`room-grid-tile${index === 0 ? " is-lead" : ""}`}
            onClick={() => show(index)}
            aria-label={`Open photo: ${image.label}`}
          >
            <Image
              src={image.src}
              width={image.width}
              height={image.height}
              alt={image.alt}
              sizes={index === 0 ? "(max-width: 760px) 100vw, 50vw" : "(max-width: 760px) 100vw, 25vw"}
              preload={index === 0}
            />
          </button>
        ))}
      </div>
        <button type="button" className="room-grid-all" onClick={() => show(0)}>
          <LayoutGrid size={16} /> Show all photos
        </button>
      </div>
      <p className="room-grid-note">{note}</p>

      {open !== null && (
        <div className="room-lightbox" role="dialog" aria-modal="true" aria-label="All photos">
          <div className="room-lightbox-bar">
            <button ref={closeRef} type="button" className="room-lightbox-close" onClick={close}>
              <XIcon size={18} /> Close
            </button>
            <span>{images.length} photos · {note}</span>
          </div>
          <div className="room-lightbox-list">
            {images.map((image, index) => (
              <figure key={image.src} id={`room-photo-${index}`}>
                <Image
                  src={image.src}
                  width={image.width}
                  height={image.height}
                  alt={image.alt}
                  sizes="(max-width: 1000px) 100vw, 960px"
                />
                <figcaption>{image.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
