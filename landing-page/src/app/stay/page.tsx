import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import SubpageHeader from "../subpage-header";
import PlanCallout from "../plan-callout";
import StayShowcase from "../stay-showcase";
import { roomTypes } from "../stay-data";

export const metadata: Metadata = {
  title: "Accommodations & Cottages | Golden Hills Resort",
  description:
    "Explore luxury rooms, standalone wooden cottages, and poolside villas at Golden Hills Resort, Biligi. View room photos, washroom renders, amenities, and meal plans.",
};

export default function StayPage() {
  return (
    <>
      <SubpageHeader />

      <main id="top" className="subpage-main sp-page-stay spage">
        <StayShowcase rooms={roomTypes} />

        <PlanCallout sketch="cottage"
          title="Planning a longer stay or a group booking?"
          href="/plan-ahead#bookings"
          action="Check availability"
        />
      </main>

      <SiteFooter />
    </>
  );
}
