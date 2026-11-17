import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import SubpageHeader from "../subpage-header";
import PlanCallout from "../plan-callout";
import MotionProvider from "../motion-provider";
import VenueStack from "../venue-stack";
import { LightString } from "../pencil";
import { gatheringVenues } from "../gatherings-data";

export const metadata: Metadata = {
  title: "Celebration & Banquet Venues | Golden Hills Resort",
  description:
    "Explore 1,000-pax destination celebration venues at Golden Hills Resort, Biligi. Indoor AC conference halls, open banquet lawns, and poolside LED lawns with zero hall-rental policy.",
};

export default function GatheringsPage() {
  return (
    <>
      <SubpageHeader />

      <MotionProvider>
        <main id="top" className="subpage-main sp-page-gather gpage">
          <section className="gintro" aria-labelledby="gather-title">
            <LightString className="gintro-lights" />
            <div className="wrap gintro-inner">
              <p className="gintro-kicker">Room to gather</p>
              <h1 id="gather-title">Venues for weddings, conferences &amp; banquets</h1>
              <p className="gintro-line">Indoor halls and open lawns, billed per plate with no hall rental.</p>
              <dl className="gintro-facts">
                <div><dt>Spaces to book</dt><dd>6</dd></div>
                <div><dt>Guests combined</dt><dd>1,000</dd></div>
                <div><dt>Hall rental</dt><dd>Zero</dd></div>
              </dl>
              <p className="gintro-cue">From a pavilion for 40 to a lawn for 500</p>
            </div>
          </section>

          <section className="wrap gstack" aria-label="Celebration venues, smallest to largest">
            <VenueStack venues={gatheringVenues} />
          </section>

          <PlanCallout sketch="banquet"
            title="Have a date and a guest count in mind?"
            href="/plan-ahead#enquiries"
            action="Enquire about a venue"
          />
        </main>
      </MotionProvider>

      <SiteFooter />
    </>
  );
}
