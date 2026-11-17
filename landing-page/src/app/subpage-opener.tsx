import Image from "next/image";
import { getScene, impression } from "./resort-assets";

/* Opening band for the four list subpages (unit 3.18, phase 2). Each page
 * opens on its own photograph with the title over it, instead of the screen
 * of text they all shared. The frame is rounded and sits inside .wrap, so it
 * lines up with everything else on the page and never bleeds off the edge. */

export type Fact = { value: string; label: string };

export default function SubpageOpener({ kicker, title, line, sceneId, alt, facts }: {
  kicker: string;
  title: string;
  line: string;
  sceneId: string;
  alt: string;
  facts: Fact[];
}) {
  const scene = getScene(sceneId);
  return (
    <section className="sp-open wrap" aria-labelledby="sp-title">
      <div className="sp-open-frame">
        <Image {...scene} alt={alt} sizes="(max-width: 1440px) 100vw, 1325px" preload />
        <div className="sp-open-text">
          <p className="sp-open-kicker">{kicker}</p>
          <h1 id="sp-title">{title}</h1>
        </div>
      </div>
      <div className="sp-open-under">
        <p className="sp-open-line">{line}</p>
        <p className="sp-open-note">{impression}</p>
      </div>
      <dl className="sp-facts">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
