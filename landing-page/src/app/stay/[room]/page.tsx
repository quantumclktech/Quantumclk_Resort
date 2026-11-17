/* Room detail page (unit 3.17, ERP-01). One page per accommodation category,
 * laid out like an Airbnb listing: photos, a few scannable facts, a short
 * paragraph last, and a booking card that sends a request into the ERP.
 * No ratings, reviews or host block — the resort is not built yet, so any
 * of those would be invented. */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SubpageHeader from "../../subpage-header";
import SiteFooter from "../../site-footer";
import RoomGallery, { type GalleryImage } from "../../room-gallery";
import BookingCard from "../../booking-card";
import ShareButton from "../../share-button";
import { roomTypes } from "../../stay-data";
import { MealPlans, RoomCard } from "../../stay-shared";
import { Sketch } from "../../pencil";
import type { RoomFeatureIcon } from "../../stay-cards";
import { getScene, impression } from "../../resort-assets";
import {
  ArrowLeft, Bath, BedDouble, House, Laptop, Leaf, Lock, MapPin, PawPrint,
  PoolWaves, ShowerHead, Sofa, SpaLotus, Ruler, Users, Utensils, Wifi,
} from "../../icons";

const FEATURE_ICONS: Record<RoomFeatureIcon, typeof BedDouble> = {
  bed: BedDouble, ruler: Ruler, shower: ShowerHead, bath: Bath, wifi: Wifi,
  desk: Laptop, sofa: Sofa, leaf: Leaf, home: House, lock: Lock, paw: PawPrint,
  pool: PoolWaves, spa: SpaLotus, users: Users, dining: Utensils,
};

/** "Up to 2 Adults" -> "Up to 2 adults"; the data is written in Title Case. */
const sentence = (text: string) => text.charAt(0) + text.slice(1).toLowerCase();


function findRoom(slug: string) {
  return roomTypes.find((room) => room.slug === slug);
}

// Only the six real categories exist; any other /stay/<x> is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return roomTypes.map((room) => ({ room: room.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ room: string }> }): Promise<Metadata> {
  const room = findRoom((await params).room);
  if (!room) return {};
  return {
    title: `${room.title} | Golden Hills Resort`,
    description: room.lead,
  };
}

export default async function RoomPage({ params }: { params: Promise<{ room: string }> }) {
  const room = findRoom((await params).room);
  if (!room) notFound();

  const images: GalleryImage[] = room.images.map((image) => ({
    ...getScene(image.sceneId),
    alt: image.alt,
    label: sentence(image.label),
  }));
  const tariff = Number((room.startingTariff ?? "0").replace(/[^\d]/g, ""));
  const wholeUnit = (room.taxNote ?? "").startsWith("Full Unit");
  const priceNote = wholeUnit
    ? `Whole cottage, up to ${room.maxGuests} guests · excl. 12% GST`
    : "Starting tariff · excl. 12% GST";
  const kind = room.title.includes("Cottage") ? "cottage" : room.title.includes("Suite") ? "suite" : "room";

  return (
    <>
      <SubpageHeader />
      <main id="top" className="room-page wrap">
        <Link href="/stay" className="room-back"><ArrowLeft size={16} /> All stays</Link>

        <div className="room-title-row">
          <h1>{room.title}</h1>
          <ShareButton title={room.title} />
        </div>

        <RoomGallery images={images} note={impression} />

        <div className="room-body">
          <div className="room-main">
            <header className="room-summary">
              <h2><MapPin size={20} /> {room.zone}, Golden Hills Resort</h2>
              <p className="room-facts">{room.specs.split(" · ").map(sentence).join(" · ")}</p>
            </header>

            <ul className="room-features">
              {room.features.map((feature) => {
                const Icon = FEATURE_ICONS[feature.icon];
                return (
                  <li key={feature.title}>
                    <span className="room-feature-icon" aria-hidden="true"><Icon size={22} /></span>
                    <div>
                      <strong>{feature.title}</strong>
                      <span>{feature.detail}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <section className="room-meals" aria-labelledby="room-meals-title">
              <h3 id="room-meals-title">Meal plans</h3>
              <MealPlans plans={room.mealPlans} />
            </section>

            <section className="room-about" aria-labelledby="room-about-title">
              <Sketch name={room.zone.startsWith("Hotel") ? "hotel" : room.zone.startsWith("Poolside") ? "pool" : "cottage"} className="room-about-sketch" />
              <h3 id="room-about-title">About this {kind}</h3>
              <p>{room.lead}</p>
            </section>
          </div>

          <aside className="room-aside" id="booking" aria-label={`Book the ${room.title}`}>
            <BookingCard
              title={room.title}
              inquiryName={room.inquiryName}
              tariff={tariff}
              priceNote={priceNote}
              maxGuests={room.maxGuests}
              extraBed={room.extraBed}
              mealPlans={room.mealPlans}
            />
          </aside>
        </div>

        {/* Keep the visitor choosing: three other stays, nearest in price first. */}
        <section className="room-more" aria-labelledby="room-more-title">
          <h2 id="room-more-title">Other ways to stay</h2>
          <div className="srooms-grid">
            {roomTypes
              .filter((other) => other.slug !== room.slug)
              .sort((x, y) => Math.abs(Number((x.startingTariff ?? "0").replace(/\D/g, "")) - tariff) - Math.abs(Number((y.startingTariff ?? "0").replace(/\D/g, "")) - tariff))
              .slice(0, 3)
              .map((other, i) => <RoomCard key={other.slug} room={other} index={i} />)}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
