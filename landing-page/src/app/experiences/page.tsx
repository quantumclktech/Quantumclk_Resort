import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import SubpageHeader from "../subpage-header";
import PlanCallout from "../plan-callout";
import MotionProvider from "../motion-provider";
import ExperienceDay from "../experience-day";
import { Sketch } from "../pencil";
import { resortExperiences } from "../experiences-data";

export const metadata: Metadata = {
  title: "Curated Experiences & Day Outings | Golden Hills Resort",
  description:
    "Explore bespoke resort moments at Golden Hills Resort, Biligi. From private poolside candlelight gazebos and starlit campfires to full-day recreation packages.",
};

export default function ExperiencesPage() {
  return (
    <>
      <SubpageHeader />

      <MotionProvider>
        <main id="top" className="subpage-main sp-page-exp xpage">
          <section className="xintro wrap" aria-labelledby="exp-title">
            <div className="xintro-text">
              <p className="xintro-kicker">Curated experiences</p>
              <h1 id="exp-title">Signature moments &amp; full&#8209;day outings</h1>
              <p className="xintro-line">
                Candlelit poolside dinners, open-air cinema, campfires and full-day outings for couples, families and groups.
              </p>
              <dl className="xintro-facts">
                <div><dt>Experiences</dt><dd>7</dd></div>
                <div><dt>Each</dt><dd>2–7 hrs</dd></div>
                <div><dt>Day outing</dt><dd>10 AM – 5 PM</dd></div>
              </dl>
            </div>
            <Sketch name="hills" className="xintro-sketch" />
          </section>

          <ExperienceDay experiences={resortExperiences} />

          <PlanCallout sketch="bonfire"
            title="Want a moment arranged for your dates?"
            href="/plan-ahead#experiences"
            action="Plan an experience"
          />
        </main>
      </MotionProvider>

      <SiteFooter />
    </>
  );
}
