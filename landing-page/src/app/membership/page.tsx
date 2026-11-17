import type { Metadata } from "next";
import Link from "next/link";
import SubpageHeader from "../subpage-header";
import MotionProvider from "../motion-provider";
import SiteFooter from "../site-footer";
import MembershipCard from "../membership-card";
import MembershipLedger from "../membership-ledger";
import MembershipMine from "../membership-mine";
import { LedgerHeading, MemberFigures, MemberHeroCopy, ProspectOnly } from "../membership-member-hero";
import { Sketch } from "../pencil";
import MembershipExtras from "../membership-extras";
import CountUp from "../count-up";
import MembershipInquiryForm from "./membership-inquiry-form";
import { ArrowRight, ArrowDown } from "../icons";

export const metadata: Metadata = {
  title: "Privilege Club & Membership | Golden Hills Resort",
  description:
    "Explore 180 exclusive loyalty privileges at Golden Hills Resort, Biligi. 55 vouchers and 125 discount coupons across stays, gourmet dining, private banquets, and spa therapies.",
};

export default function MembershipPage() {
  return (
    <>
      <SubpageHeader />

      {/* The card tilt and the counters read the motion preference through
        * this provider; without it they default to reduced and never run. */}
      <MotionProvider>
      <main id="top" className="mem-page">
        {/* The card is the page's one bright element, so it opens the page. */}
        <section className="mem-hero" aria-labelledby="mem-title">
          <div className="wrap mem-hero-grid">
            <MemberHeroCopy>
              <div className="mem-hero-copy">
                <p className="mem-kicker is-on-dark">Golden Hills Privilege Club</p>
                <h1 id="mem-title">One card,<br />a year of the resort</h1>
                <p className="mem-hero-line">
                  55 vouchers and 125 coupons across stays, dining, outings, celebrations and the spa.
                </p>
                <div className="mem-hero-actions">
                  <Link href="#inquire" className="mem-btn">Enquire about membership <ArrowRight size={16} /></Link>
                  <Link href="#explore" className="mem-link">See what is inside <ArrowDown size={15} /></Link>
                </div>
              </div>
            </MemberHeroCopy>

            <MembershipCard vouchers={55} coupons={125} />
          </div>

          <MemberFigures>
            <dl className="wrap mem-figures">
              <div><dt>Privileges</dt><dd><CountUp to={180} /></dd></div>
              <div><dt>Vouchers</dt><dd><CountUp to={55} /></dd></div>
              <div><dt>Coupons</dt><dd><CountUp to={125} /></dd></div>
              <div><dt>Months valid</dt><dd><CountUp to={12} /></dd></div>
              <div><dt>Transferable</dt><dd><CountUp to={100} suffix="%" /></dd></div>
            </dl>
          </MemberFigures>
        </section>

        {/* Members: what is used and what is left (sign-in here if not). */}
        <MembershipMine />

        {/* The seven parts, as an account that adds up to 180. */}
        <section id="explore" className="mem-ledger-section" aria-labelledby="ledger-title">
          <div className="wrap mem-ledger-head">
            <Sketch name="hills" className="mem-sketch" />
            <LedgerHeading />
          </div>
          <div className="wrap">
            <MembershipLedger />
          </div>
        </section>

        {/* Not for members: the enrolment box, the pre-enrolment FAQ and
          * the enrolment form. */}
        <ProspectOnly>
        <MembershipExtras />

        <section id="inquire" className="wrap mem-inquiry-section" aria-labelledby="inquire-title">
          <Sketch name="tree" className="mem-sketch" />
          <div className="mem-inquiry-grid">
            <div className="mem-inquiry-info">
              <p className="mem-kicker">Charter member intake</p>
              <h2 id="inquire-title" className="mem-inquiry-heading">
                Reserve your membership
              </h2>
              <p className="mem-inquiry-text">
                Charter memberships are allocated in order of interest before opening. Register below for the prospectus and charter pricing.
              </p>
              <ul className="mem-perks">
                <li>Digital voucher ledger as soon as you enrol</li>
                <li>Welcome keepsake box delivered to you</li>
                <li>Club concierge for room and banquet bookings</li>
              </ul>
            </div>

            <div className="mem-inquiry-form-wrapper">
              <MembershipInquiryForm />
            </div>
          </div>
        </section>
        </ProspectOnly>
      </main>
      </MotionProvider>

      <SiteFooter />
    </>
  );
}
