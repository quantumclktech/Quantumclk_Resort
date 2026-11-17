import { Sketch } from "./pencil";
import { welcomeKit, membershipFaqs } from "./membership-data";
import { Bottle, Briefcase, Coffee, CreditCard, ShoppingBag } from "./icons";

const KIT_ICONS = { tote: ShoppingBag, flask: Bottle, mug: Coffee, pouch: Briefcase, card: CreditCard };

/* The keepsake kit and the questions (unit 3.19). Lifted out of the old card
 * component so the ledger can replace it. The kit's count pills are gone:
 * the three terms read as a plain line, and the FAQ is a <details> so a
 * closed answer is not on the screen. */

export default function MembershipExtras() {
  return (
    <>
      <section className="wrap mem-kit" aria-labelledby="kit-title">
        <Sketch name="lantern" className="mem-sketch" />
        <div className="mem-kit-head">
          <p className="mem-kicker">Complimentary on enrolment</p>
          <h2 id="kit-title">Five things arrive in a box</h2>
        </div>

        {/* The box itself: a lid line, then its contents laid out. */}
        <div className="kit-box">
          <p className="kit-box-lid">
            <span>Welcome keepsake box</span>
            <span className="kit-box-count">5 pieces</span>
          </p>
          <ul className="kit-grid">
            {welcomeKit.map((item, index) => {
              const Icon = KIT_ICONS[item.icon];
              return (
                <li key={item.name}>
                  <span className="kit-icon" aria-hidden="true"><Icon size={26} /></span>
                  <span className="kit-no" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.name}</strong>
                  <span className="kit-detail">{item.detail}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mem-kit-terms">12 months validity · Fully transferable · No weekday blackout</p>
      </section>

      <section className="wrap mem-faq" aria-labelledby="faq-title">
        <Sketch name="palm" className="mem-sketch" />
        <div className="mem-faq-head">
          <p className="mem-kicker">Questions</p>
          <h2 id="faq-title">Before you enrol</h2>
        </div>
        <div className="mem-faq-list">
          {membershipFaqs.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
