import Image from "next/image";
import Link from "next/link";
import HomeOpening, { type OpeningFeature, type OpeningSlide } from "./home-opening";
import SubpageHeader from "./subpage-header";
import { Sketch } from "./pencil";
import GallerySlider from "./gallery-slider";
import MotionProvider from "./motion-provider";
import SiteFooter from "./site-footer";
import { ArrowRight, MapPin } from "./icons";
import { getScene, impression } from "./resort-assets";
import Reveal from "./reveal";
import LocationMapCard from "./location-map-card";
import HighlightsCards, { type HighlightItem } from "./highlights-cards";
import { type AmenityTile } from "./amenity-grid";
import AmenityTrail from "./amenity-trail";
import SwipeRow from "./swipe-row";
import { roomTypes } from "./stay-data";

/* =========================================================================
   1. Data grounded in Resort ERP SRS, Project Report & Loyalty Documents
   ========================================================================= */

const whyChooseUsHighlights: HighlightItem[] = [
  { icon: "dining", title: "Six dining outlets", desc: "Veg and non-veg kitchens" },
  { icon: "venues", title: "1,000-guest venues", desc: "Zero hall rental" },
  { icon: "rooms", title: "Six room types", desc: "Rooms, a suite and cottages" },
  { icon: "recreation", title: "Recreation for all ages", desc: "Pools, zipline and rain dance" },
  { icon: "location", title: "Northern Karnataka gateway", desc: "Near Badami, Aihole and Almatti" },
  { icon: "infrastructure", title: "Modern essentials", desc: "Wi-Fi, power backup, EV charging" },
];

/* Amenities as icon tiles. Each detail line comes from the facility notes the
 * old photo cards carried; the stock photos themselves are no longer used here. */
const amenityTiles: AmenityTile[] = [
  { icon: "pool", label: "Swimming pool", hours: "7 AM – 7 PM", details: [
    "4–5 ft freshwater main pool with loungers", "Shallow splash zone for toddlers",
    "Morning swim (6–10 AM) for room guests; day visitors 10 AM – 5 PM"] },
  { icon: "spa", label: "Spa & wellness", hours: "11 AM – 11 PM", details: [
    "Ayurvedic therapies and herbal body massages", "Private steam and aromatic relaxation rooms",
    "Couples treatment suites on reservation"] },
  { icon: "gym", label: "Gym & indoor games", hours: "7 AM – 11 PM", details: [
    "Cardio and strength equipment", "Snooker, pool, table tennis, carrom and chess",
    "VR gaming and a quiet reading corner"] },
  { icon: "adventure", label: "Zipline & sky cycling", hours: "10 AM – 5 PM", details: [
    "Aerial sky cycling above the grounds", "High-glide zipline over the gardens",
    "Harnesses and trained instructors provided"] },
  { icon: "raindance", label: "Rain dance", hours: "30 min sessions", details: [
    "Overhead mist and warm-water rainfall jets", "Sound-responsive party lighting",
    "Sessions run through the afternoon"] },
  { icon: "bonfire", label: "Bonfire & nature walks", hours: "7 PM – 11 PM", details: [
    "Nightly campfire on the Butterfly Lawn", "Morning guided walk along the Ghataprabha",
    "Walks leave the reception lobby at 7 AM"] },
  { icon: "wifi", label: "Wi-Fi & power", hours: "Resort-wide", details: [
    "High-speed Wi-Fi across the resort", "24/7 power backup with dual DG generators"] },
  { icon: "core", label: "Parking & access", hours: "24 hours", details: [
    "EV charging and guarded parking", "Barrier-free ramps and accessible paths",
    "24-hour front desk and CCTV"] },
];

/* The opening's renders, in the order a guest would meet them. */
const openingSlides: OpeningSlide[] = [
  { scene: getScene("hero-pool-day-desktop-p37"), label: "Pool courtyard concept", alt: "Pool courtyard and illuminated arched seating pavilion at Golden Hills Resort", focalPoint: "center 54%" },
  { scene: getScene("arrival-reception-lounge-p11"), label: "Main reception lounge concept", alt: "Double-height reception lounge concept with floor-to-ceiling glass and outdoor landscape views", focalPoint: "center 55%" },
  { scene: getScene("cottage-pool-terrace-p34"), label: "Private pool cottage concept", alt: "Shaded terrace seating beside a private plunge pool outside a cottage at golden hour", focalPoint: "58% 58%" },
  { scene: getScene("gatherings-banquet-p03"), label: "Banquet hall concept", alt: "Banquet hall laid with round tables and a stage for a celebration", focalPoint: "center 58%" },
  { scene: getScene("dining-veg-central-aisle-p12"), label: "Vegetarian restaurant concept", alt: "Vegetarian restaurant dining room with banquette seating and a painted crane mural", focalPoint: "center 56%" },
  { scene: getScene("dusk-pool-candidate-p38"), label: "Poolside cottages at dusk", alt: "Poolside cottages at dusk with lanterns reflected in the water", focalPoint: "center 60%" },
];

/* The brand story, moved into the opening (it was its own section): the
 * short statement under the portrait, as on the reference. Same words. */
const openingIntro = {
  title: "A family-friendly retreat taking shape in northern Karnataka",
  lead: "A serene base on the Hubli–Vijayapur highway, where families unwind and celebrations come together.",
  credit: "Promoted by Smt. Asha Bilagi and family · Designed by Astu Architects and Rajvi Jhaveri",
};

/* What the resort holds, each as a pencil sketch. Every label is a fact
 * already stated further down this page. */
const openingFeatures: OpeningFeature[] = [
  { sketch: "pool", label: "Pool courtyard" },
  { sketch: "cottage", label: "Private pool cottages" },
  { sketch: "thali", label: "Two separate kitchens" },
  { sketch: "banquet", label: "1,000-guest venues" },
  { sketch: "zipline", label: "Zipline & sky cycling" },
  { sketch: "temple", label: "Badami caves, 55 km" },
];

/* The six outlets, as named on the dining page. */
const diningOutlets = ["Pure veg restaurant", "Non-veg restaurant", "Bar lounge", "Resto-bar cafe", "Courtyard cafe", "Banquet dining"];

/* Only the experiences with an architect's render; the rest use stock photos. */
const moments = [
  { scene: "dusk-pool-candidate-p38", name: "Candlelight dinner", detail: "2 hours", alt: "Poolside cottages at dusk with lanterns reflected in the water" },
  { scene: "cottage-pool-terrace-p34", name: "Poolside sundowner", detail: "2 hours", alt: "Covered timber deck with armchairs beside a cottage pool" },
  { scene: "hero-pool-day-desktop-p37", name: "Full-day outing", detail: "7 hours", alt: "Central pool and poolside cottages in daylight" },
];

/** "Badami Cave Temples (55 km)" -> ["Badami Cave Temples", "55 km"]. */
function splitDistance(name: string): [string, string] {
  const match = name.match(/^(.*?)\s*\((\d+ km)\)$/);
  return match ? [match[1], match[2]] : [name, ""];
}

const nearbyAttractions = [
  {
    name: "Almatti Dam & Krishna River Basin (18 km)",
    desc: "One of South India's largest dams on the Krishna River, featuring terraced Mughal gardens, musical dancing fountains, and boating.",
  },
  {
    name: "Badami Cave Temples (55 km)",
    desc: "Renowned 6th-century Chalukyan rock-cut cave temples, Agastya Lake, Bhutanatha Temples, and archaeological museum.",
  },
  {
    name: "Aihole & Pattadakal (60 km)",
    desc: "UNESCO World Heritage cradle of ancient Indian temple architecture, including the 7th-century Durga Temple and Lad Khan Temple.",
  },
];

/* =========================================================================
   2. Main Home Page (13 Sections in Strict Sequence)
   ========================================================================= */

export default function Home() {
  return (
    <MotionProvider>
      <a className="skip-link" href="#story">Skip to content</a>
      <SubpageHeader overlay />
      <main id="main-content" tabIndex={-1}>

        {/* 1. Opening — a pinned, scroll-driven slideshow (home-opening.tsx). */}
        <HomeOpening slides={openingSlides} features={openingFeatures} intro={openingIntro} />

        {/* 3. Accommodation Showcase */}
        <section id="stay" className="home-rooms wrap" aria-labelledby="stay-title" tabIndex={-1}>
          <Sketch name="cottage" className="sec-sketch sec-sketch--stay" />
          <div className="home-row-head">
            <div>
              <div className="status-line">
                <p className="section-note">Accommodations</p>
                <span className="section-status">Six categories · from ₹4,999 a night</span>
              </div>
              <h2 id="stay-title">Rooms, cottages &amp; private pool villas</h2>
            </div>
            <Link href="/stay" className="home-row-link">All stays <ArrowRight size={15} /></Link>
          </div>
          <SwipeRow label="Rooms and cottages">
            {roomTypes.map((room) => {
              const cover = getScene(room.images[0].sceneId);
              return (
                <Link key={room.slug} href={`/stay/${room.slug}`} className="room-tile" role="listitem">
                  <span className="room-tile-media">
                    <Image src={cover.src} width={cover.width} height={cover.height} alt={room.images[0].alt} sizes="(max-width: 760px) 78vw, 320px" />
                  </span>
                  <span className="room-tile-name">{room.title}</span>
                  <span className="room-tile-price">From {room.startingTariff} a night</span>
                </Link>
              );
            })}
          </SwipeRow>
          <p className="home-row-note">{impression}</p>
        </section>

        {/* 4. Amenities */}
        <section id="amenities" className="amenities-section wrap" aria-labelledby="amenities-title" tabIndex={-1}>
          <div className="amenities-heading">
            <div className="status-line">
              <p className="section-note">Amenities &amp; recreation</p>
              <span className="section-status">For stays &amp; day visits</span>
            </div>
            <h2 id="amenities-title">Recreation, wellness and adventure facilities</h2>
          </div>
          <AmenityTrail tiles={amenityTiles} />
        </section>

        {/* 5. Dining Showcase */}
        <section id="dining" className="dining-section wrap" aria-labelledby="dining-title" tabIndex={-1}>
          <Sketch name="thali" className="sec-sketch sec-sketch--dining" />
          <div className="showcase-split-layout">
            <div className="showcase-left">
              <div className="status-line">
                <p className="section-note">Dining destinations</p>
                <span className="section-status">Six culinary outlets</span>
              </div>
              <h2 id="dining-title">Distinct culinary outlets &amp; separate kitchens</h2>
              <ul className="home-chips" aria-label="Dining outlets">
                {diningOutlets.map((outlet) => <li key={outlet}>{outlet}</li>)}
              </ul>
              <div className="showcase-cta-wrap">
                <Link href="/dining" className="showcase-cta-btn">
                  <span>View dining destinations</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <Link href="/dining" className="showcase-right-card" aria-label="Explore all 6 dining destinations">
              <div className="showcase-media-frame">
                <Image
                  src={getScene("dining-veg-seating-p13").src}
                  alt="Golden Hills Resort pure vegetarian dining hall render"
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  className="showcase-media-img"
                />
              </div>
              <div className="showcase-card-body">
                <span className="showcase-card-link">
                  View menus &amp; timings <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* 6. Experiences Showcase */}
        <section id="experiences" className="home-moments wrap" aria-labelledby="experiences-title" tabIndex={-1}>
          <Sketch name="bonfire" className="sec-sketch sec-sketch--experiences" />
          <div className="home-row-head">
            <div>
              <div className="status-line">
                <p className="section-note">Curated experiences</p>
                <span className="section-status">Seven to choose from</span>
              </div>
              <h2 id="experiences-title">Signature moments &amp; full&#8209;day outings</h2>
            </div>
            <Link href="/experiences" className="home-row-link">All experiences <ArrowRight size={15} /></Link>
          </div>
          <ul className="moment-strip" aria-label="Experiences">
            {moments.map((moment) => {
              const scene = getScene(moment.scene);
              return (
                <li key={moment.name}>
                  <Link href="/experiences" className="moment-tile">
                    <Image src={scene.src} width={scene.width} height={scene.height} alt={moment.alt} sizes="(max-width: 760px) 78vw, 33vw" />
                    <span className="moment-tile-caption">
                      <strong>{moment.name}</strong>
                      <span>{moment.detail}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="home-row-note">{impression}</p>
        </section>

        {/* 7. Room to Gather Showcase */}
        <section id="gatherings" className="stay-section wrap" aria-labelledby="gatherings-title" tabIndex={-1}>
          <Sketch name="banquet" className="sec-sketch sec-sketch--gatherings" />
          <div className="showcase-split-layout is-flipped">
            <div className="showcase-left">
              <div className="status-line">
                <p className="section-note">Room to gather</p>
              </div>
              <h2 id="gatherings-title">Venues for weddings, conferences &amp; banquets</h2>
              <dl className="home-numbers">
                <div><dt>Venues</dt><dd>3</dd></div>
                <div><dt>Guests</dt><dd>1,000</dd></div>
                <div><dt>Hall rental</dt><dd>Zero</dd></div>
              </dl>
              <div className="showcase-cta-wrap">
                <Link href="/gatherings" className="showcase-cta-btn">
                  <span>View celebration venues</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <Link href="/gatherings" className="showcase-right-card" aria-label="Explore all celebration and banquet venues">
              <div className="showcase-media-frame">
                <Image
                  src={getScene("gatherings-banquet-p03").src}
                  alt="Golden Hills Resort conference and banquet hall render"
                  fill
                  sizes="(max-width: 900px) 100vw, 560px"
                  className="showcase-media-img"
                />
              </div>
              <div className="showcase-card-body">
                <span className="showcase-card-link">
                  View event spaces &amp; catering menus <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* 8. Gallery */}
        <section id="gallery" className="gallery-section wrap" aria-labelledby="gallery-title" tabIndex={-1}>
          <Sketch name="pool" className="sec-sketch sec-sketch--gallery" />
          <div className="gallery-heading">
            <div className="status-line">
              <p className="section-note">Visual preview</p>
              <span className="section-status">17 perspectives</span>
            </div>
            <h2 id="gallery-title">Architectural design concepts &amp; spaces</h2>
          </div>
          <GallerySlider />
        </section>

        {/* 9. Location & Nearby Attractions */}
        <section id="location" className="location-section wrap" aria-labelledby="location-title" tabIndex={-1}>
          <Sketch name="temple" className="sec-sketch sec-sketch--location" />
          <div className="location-copy">
            <p className="section-note">Location &amp; heritage</p>
            <h2 id="location-title">In the historic heart of northern Karnataka</h2>
            <p>On the Hubli–Vijayapur National Highway, 30 km from Bagalkote town.</p>
            <ul className="home-distances" aria-label="Nearby heritage sites">
              {nearbyAttractions.map((attraction) => {
                const [place, km] = splitDistance(attraction.name);
                return (
                  <li key={attraction.name}>
                    <MapPin size={16} />
                    <span>{place}</span>
                    <strong>{km}</strong>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="location-aside">
            <LocationMapCard />
          </div>
        </section>

        {/* 9. Resort Overview / Why Choose Us */}
        <section id="highlights" className="highlights-section wrap" aria-labelledby="highlights-title" tabIndex={-1}>
          <Sketch name="tree" className="sec-sketch sec-sketch--highlights" />
          <div className="highlights-heading">
            <div className="status-line">
              <p className="section-note">Resort overview</p>
              <span className="section-status">Why choose us</span>
            </div>
            <h2 id="highlights-title">Hospitality, recreation and celebration in one destination</h2>
          </div>
          <HighlightsCards items={whyChooseUsHighlights} />
        </section>

        {/* 11. Membership Privileges Teaser (Short, High-Impact & Direct) */}
        <section id="offers" className="membership-teaser-section wrap" aria-labelledby="offers-title" tabIndex={-1}>
          <div className="membership-teaser-card">
            <div className="membership-teaser-media">
              <Image
                src={getScene("dusk-pool-candidate-p38").src}
                alt="Golden Hills Resort evening pool and illuminated cottages"
                fill
                sizes="(max-width: 900px) 100vw, 600px"
                className="membership-teaser-img"
              />
            </div>

            <div className="membership-teaser-content">
              <div className="status-line" style={{ marginBottom: "12px" }}>
                <p className="section-note">Golden Hills Privilege Club</p>
                <span className="section-status">Charter enrollment open</span>
              </div>

              <h2 id="offers-title" className="membership-teaser-heading">
                180 privileges with the Privilege Club
              </h2>

              <p className="membership-teaser-lead">
                55 vouchers and 125 coupons for stays, dining, outings and celebrations.
              </p>

              <div className="membership-teaser-features">
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> 2 free room stays &amp; 10 BOGO nights
                </div>
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> 70 dining, buffet &amp; brunch deals
                </div>
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> 25 full-day outing recreation passes
                </div>
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> Up to 6 free rooms with banquets
                </div>
                <div className="membership-feature-chip">
                  <span className="chip-bullet">✓</span> 12 months validity · Fully transferable
                </div>
              </div>

              <div className="membership-teaser-action-row">
                <Link href="/membership" className="membership-teaser-btn">
                  <span>Explore 180 membership privileges</span>
                  <ArrowRight size={16} />
                </Link>
                <span className="membership-teaser-subtext">
                  Complete voucher ledger &amp; gift kit
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 12. Footer */}
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
