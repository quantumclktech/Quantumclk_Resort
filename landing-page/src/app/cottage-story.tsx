"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { useRef, useState, useSyncExternalStore, type RefObject } from "react";
import ConceptFigure from "./concept-figure";
import { useMotionPreference } from "./motion-provider";
import { impression, type Scene } from "./resort-assets";

const query = "(min-width: 1000px) and (min-height: 650px)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => false;

const chapters = [
  { id: "cottage-entry", title: "Beyond the garden gate.", label: "Entrance study", alt: "Proposed stone-framed cottage entrance with a garden gate", copy: "Stone, planting and a sheltered entrance. The cottage studies begin with a transition from the outside world." },
  { id: "cottage-pool", title: "A little world of your own.", label: "Pool courtyard study", alt: "Overhead design view of a cottage, pool and enclosed courtyard", copy: "At the centre of the proposal: an intimate courtyard, with water bringing a different rhythm to the space." },
  { id: "cottage-terrace", title: "Room to simply be.", label: "Poolside terrace study", alt: "Proposed cottage terrace with shaded seating beside the pool", copy: "A shaded seat. A quieter corner. The terrace study explores how a moment of pause might feel." },
];

function CinematicStage({ views, track }: { views: Scene[]; track: RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const entrance = useTransform(scrollYProgress, [0, 0.22, 0.36, 1], [1, 1, 0, 0]);
  const pool = useTransform(scrollYProgress, [0, 0.22, 0.36, 0.64, 0.78, 1], [0, 0, 1, 1, 0, 0]);
  const terrace = useTransform(scrollYProgress, [0, 0.64, 0.78, 1], [0, 0, 1, 1]);
  const aperture = useTransform(scrollYProgress, [0, 0.12, 0.34, 1], [
    "inset(0% 10% 0% 10% round 46% 46% 0% 0%)",
    "inset(0% 10% 0% 10% round 46% 46% 0% 0%)",
    "inset(0% 0% 0% 0% round 0% 0% 0% 0%)",
    "inset(0% 0% 0% 0% round 0% 0% 0% 0%)",
  ]);
  const opacities = [entrance, pool, terrace];
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", value => {
    const next = value < 0.3 ? 0 : value < 0.72 ? 1 : 2;
    setActive(previous => previous === next ? previous : next);
  });

  return (
    <figure className="story-stage concept-figure">
      <motion.div className="story-aperture" style={{ clipPath: aperture }}>
        {views.map((scene, index) => (
          <motion.div key={scene.src} className="story-scene" style={{ opacity: opacities[index] }} aria-hidden={active !== index}>
            <div className="concept-image"><div className="concept-media">
              <Image {...scene} alt={chapters[index].alt} sizes="(min-width: 1600px) 1000px, 64vw" />
            </div></div>
          </motion.div>
        ))}
      </motion.div>
      <figcaption><span>{chapters[active].label}</span><span>{impression}</span></figcaption>
      <div className="story-progress" aria-hidden="true"><motion.span style={{ scaleX: scrollYProgress }} /></div>
    </figure>
  );
}

export default function CottageStory({ views }: { views: Scene[] }) {
  const track = useRef<HTMLDivElement>(null);
  const wide = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const reduced = useMotionPreference();
  const cinematic = wide && !reduced;

  return (
    <section id="cottages" className="cottage-section" aria-labelledby="cottages-title" tabIndex={-1}>
      <div className="cottage-heading wrap">
        <p className="section-note">The cottage studies</p>
        <h2 id="cottages-title">Through the<br />garden gate.</h2>
        <p className="cottage-disclaimer">Three views of a proposed retreat.<br />An early design vision, still taking shape.</p>
      </div>
      <div ref={track} className={`story-track wrap${cinematic ? " is-cinematic" : ""}`}>
        <div className="story-beats">
          {chapters.map(chapter => <article className="story-beat" id={chapter.id} key={chapter.id}>
            <span className="chapter-line" aria-hidden="true" />
            <h3>{chapter.title}</h3><p>{chapter.copy}</p>
            <span className="concept-note">Design study · See image disclosure</span>
          </article>)}
        </div>
        {cinematic ? <CinematicStage views={views} track={track} /> : (
          <div className="story-stills">
            {views.map((scene, index) => <ConceptFigure key={scene.src} scene={scene} alt={chapters[index].alt} label={chapters[index].label} sizes="(max-width: 700px) 100vw, 65vw" className={`story-still story-still-${index}`} />)}
          </div>
        )}
      </div>
    </section>
  );
}
