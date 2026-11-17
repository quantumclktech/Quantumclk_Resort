import Image from "next/image";
import { impression, type Scene } from "./resort-assets";

export default function ConceptFigure({ scene, alt, label, sizes, className = "" }: {
  scene: Scene; alt: string; label: string; sizes: string; className?: string;
}) {
  return (
    <figure className={`concept-figure ${className}`}>
      <div className="concept-image">
        <div className="concept-media">
          <Image {...scene} alt={alt} sizes={sizes} />
        </div>
      </div>
      <figcaption><span>{label}</span><span>{impression}</span></figcaption>
    </figure>
  );
}
