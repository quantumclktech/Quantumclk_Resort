import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import SubpageHeader from "../subpage-header";
import PlanCallout from "../plan-callout";
import MotionProvider from "../motion-provider";
import ThaliArt from "../dining-hero-art";
import DiningIndex from "../dining-index";
import DiningFeatures from "../dining-features";
import DiningMenu from "../dining-menu";
import { diningOutlets } from "../dining-data";

export const metadata: Metadata = {
  title: "Dining Destinations | Golden Hills Resort",
  description:
    "Discover distinct culinary outlets at Golden Hills Resort, featuring pure vegetarian dining, multi-cuisine grills, and sunset lounge bar with separate kitchen facilities.",
};

export default function DiningPage() {
  return (
    <>
      <SubpageHeader />

      <MotionProvider>
        <DiningMenu outlets={diningOutlets}>
          <main id="top" className="dining-page">
            <section className="dhero" aria-labelledby="dining-title">
              <div className="wrap">
                <div className="dhero-top">
                  <div>
                    <p className="dhero-kicker">Dining destinations</p>
                    <h1 id="dining-title">Two kitchens, six rooms, one long day</h1>
                    <p className="dhero-line">Veg and non-veg cooked in separate kitchens</p>
                  </div>
                  <ThaliArt />
                </div>
  
                <DiningIndex outlets={diningOutlets} />
              </div>
            </section>
  
            <DiningFeatures outlets={diningOutlets} />
  
            <div className="dining-close">
              <PlanCallout sketch="thali"
                title="Planning a group feast or celebration?"
                href="/plan-ahead#experiences"
                action="Explore dining packages"
              />
            </div>
          </main>
          </DiningMenu>
      </MotionProvider>

      <SiteFooter />
    </>
  );
}
