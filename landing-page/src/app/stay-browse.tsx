import Image from "next/image";
import Link from "next/link";
import { getScene } from "./resort-assets";
import type { RoomCategory } from "./stay-cards";
import { ArrowRight } from "./icons";

/* /stay — a browse grid (unit 3.18, phase 4). Two wide columns, a large
 * photograph and the price. Every room now has its own page, so the old
 * in-card "More details" drawer is gone: the detail belongs there. */

export default function StayBrowse({ rooms }: { rooms: RoomCategory[] }) {
  return (
    <ul className="browse-grid" aria-label="Rooms and cottages">
      {rooms.map((room) => {
        const cover = getScene(room.images[0].sceneId);
        return (
          <li key={room.slug} className="browse-item">
            <Link href={`/stay/${room.slug}`} className="browse-link">
              <span className="browse-media">
                <Image src={cover.src} width={cover.width} height={cover.height} alt={room.images[0].alt} sizes="(max-width: 860px) 100vw, 50vw" />
                <span className="browse-count">{room.images.length} photos</span>
              </span>
              <span className="browse-body">
                <span className="browse-zone">{room.zone}</span>
                <span className="browse-name">{room.title}</span>
                <span className="browse-feats">
                  {room.features.slice(0, 2).map((f) => <span key={f.title}>{f.title}</span>)}
                </span>
                <span className="browse-foot">
                  <span className="browse-price"><strong>{room.startingTariff}</strong> night</span>
                  <span className="browse-go">View room <ArrowRight size={14} /></span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
