"use client";

/* Room page booking card (unit 3.17). Shows a live estimate and sends a
 * booking request into the ERP sales desk through the guest-portal inquiry
 * API — the same path /plan-ahead uses. Nothing is charged. */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { portalApi, type InquiryRecord } from "./portal-client";
import { useSession } from "./guest-session";
import { RESORT_DESK } from "./member-benefits";
import { Check, Minus, Plus } from "./icons";
import { getTodayStr, addDays, getNightsBetween } from "./booking-dates";

// Both rates come from stay-data.ts: "Excl. 12% GST" and "+₹600 / night".
const GST_RATE = 0.12;
const EXTRA_BED_RATE = 600;

type Props = {
  title: string;
  inquiryName: string;
  tariff: number;
  priceNote: string;
  maxGuests: number;
  extraBed: boolean;
  mealPlans: string[];
};

const inr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

/** "EP (Room Only)" -> "EP · Room only", matching the meal-plan chips on the page. */
function planLabel(plan: string) {
  const match = plan.match(/^(\w+)\s*\((.+)\)$/);
  return match ? `${match[1]} · ${match[2].charAt(0)}${match[2].slice(1).toLowerCase()}` : plan;
}

/** A local calendar date (not UTC), so late-night visitors in IST get the right day. */
function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nightsBetween(from: string, to: string) {
  if (!from || !to) return 0;
  const n = Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function BookingCard(props: Props) {
  const { title, inquiryName, tariff, priceNote, maxGuests, extraBed, mealPlans } = props;

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [today, setToday] = useState("");
  const [guests, setGuests] = useState(Math.min(2, maxGuests));
  const [bed, setBed] = useState(false);
  const [meal, setMeal] = useState(mealPlans[0] ?? "");
  // A real (Keycloak) session fills in the guest; otherwise the form asks for contact details (D-142).
  const user = useSession()?.user ?? null;

  const [askContact, setAskContact] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<InquiryRecord | null>(null);

  // On phones the bar would repeat the card's own button once the card is on
  // screen, so it steps aside while the card is visible.
  const cardRef = useRef<HTMLFormElement>(null);
  const [cardInView, setCardInView] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setCardInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [sent]);

  // Dates and the stored session only exist in the browser. The page is
  // prerendered at build time, so filling them on the server would bake in
  // the build day and mismatch on hydration.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- browser-only initial values, set once after hydration */
    const t = getTodayStr();
    setToday(t);
    setCheckin(addDays(t, 1));
    setCheckout(addDays(t, 3));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleCheckinChange = (val: string) => {
    setCheckin(val);
    if (!val) return;
    if (checkout && val >= checkout) {
      setCheckout(addDays(val, 2));
    }
  };

  const capacity = maxGuests + (bed ? 1 : 0);
  const guestCount = Math.min(guests, capacity);
  const nights = getNightsBetween(checkin, checkout);
  const roomCost = tariff * nights;
  const bedCost = bed ? EXTRA_BED_RATE * nights : 0;
  const gst = (roomCost + bedCost) * GST_RATE;
  const total = roomCost + bedCost + gst;
  const datesOk = nights > 0 && (!today || checkin >= today);

  async function send() {
    const guest = user ?? { name: name.trim(), email: email.trim(), phone: phone.trim(), token: undefined };
    setSending(true);
    setError(null);
    try {
      const record = await portalApi.submitInquiry({
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        checkinDate: checkin,
        checkoutDate: checkout,
        roomCategory: inquiryName,
        guestCount,
        notes: [
          `Meal plan: ${meal}`,
          `Extra bed: ${bed ? "yes" : "no"}`,
          `Estimate shown: ${inr(total)} for ${nights} ${nights === 1 ? "night" : "nights"} incl. 12% GST`,
          `Sent from the ${title} page`,
        ].join(". "),
      }, user?.token);
      setSent(record);
    } catch {
      // Online requests reach the sales desk only once the enquiry service is live (increment 2).
      setError(`We couldn't send this online. Please call our desk on ${RESORT_DESK.display} to book.`);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!datesOk || sending) return;
    if (!user && !askContact) { setAskContact(true); return; }
    void send();
  }

  if (sent) {
    return (
      <div className="bk" id="booking-card">
        <div className="bk-sent">
          <span className="bk-sent-mark" aria-hidden="true"><Check size={20} /></span>
          <h2>Request sent</h2>
          <p>Our sales desk will call you to confirm availability and the final tariff.</p>
          <dl className="bk-sent-rows">
            <div><dt>Reference</dt><dd className="bk-ref">{sent.publicReference}</dd></div>
            <div><dt>Stay</dt><dd>{nights} {nights === 1 ? "night" : "nights"} · {guestCount} {guestCount === 1 ? "guest" : "guests"}</dd></div>
            <div><dt>Estimate</dt><dd>{inr(total)}</dd></div>
          </dl>
          {user
            ? <Link className="bk-link" href="/plan-ahead?tab=inquiries">Track it in your inquiries</Link>
            : <p className="bk-fine">Keep the reference and quote it when we call.</p>}
          <button type="button" className="bk-again" onClick={() => { setSent(null); setAskContact(false); }}>
            Change the request
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <form ref={cardRef} className="bk" id="booking-card" onSubmit={onSubmit}>
        <div className="bk-head">
          <p className="bk-price"><strong>{inr(tariff)}</strong> night</p>
          <p className="bk-price-note">{priceNote}</p>
        </div>

        <div className="bk-body">
          <div className="bk-box">
            <div className="bk-dates">
              <label className="bk-field">
                <span>Check-in</span>
                <input
                  type="date"
                  required
                  value={checkin}
                  min={today || undefined}
                  onChange={(e) => handleCheckinChange(e.target.value)}
                />
              </label>
              <label className="bk-field">
                <span>Checkout</span>
                <input
                  type="date"
                  required
                  value={checkout}
                  min={checkin ? addDays(checkin, 1) : (today ? addDays(today, 1) : undefined)}
                  onChange={(e) => setCheckout(e.target.value)}
                />
              </label>
            </div>
            <div className="bk-guests">
              <span className="bk-field-label" id="bk-guests-label">Guests</span>
              <div className="bk-stepper" role="group" aria-labelledby="bk-guests-label">
                <button type="button" aria-label="Fewer guests" disabled={guestCount <= 1}
                  onClick={() => setGuests(Math.max(1, guestCount - 1))}><Minus size={16} /></button>
                <span aria-live="polite">{guestCount} {guestCount === 1 ? "guest" : "guests"}</span>
                <button type="button" aria-label="More guests" disabled={guestCount >= capacity}
                  onClick={() => setGuests(Math.min(capacity, guestCount + 1))}><Plus size={16} /></button>
              </div>
            </div>
          </div>

          <label className="bk-row">
            <span>Meal plan</span>
            <select value={meal} onChange={(e) => setMeal(e.target.value)}>
              {mealPlans.map((plan) => <option key={plan} value={plan}>{planLabel(plan)}</option>)}
            </select>
          </label>

          {extraBed && (
            <label className="bk-check">
              <input type="checkbox" checked={bed} onChange={(e) => setBed(e.target.checked)} />
              <span>Extra bed <em>+{inr(EXTRA_BED_RATE)} a night, room for one more guest</em></span>
            </label>
          )}

          {nights > 0 && (
            <dl className="bk-estimate">
              <div><dt>{inr(tariff)} × {nights} {nights === 1 ? "night" : "nights"}</dt><dd>{inr(roomCost)}</dd></div>
              {bed && <div><dt>Extra bed × {nights}</dt><dd>{inr(bedCost)}</dd></div>}
              <div><dt>GST 12%</dt><dd>{inr(gst)}</dd></div>
              <div className="bk-total"><dt>Estimated total</dt><dd>{inr(total)}</dd></div>
            </dl>
          )}
          {!datesOk && checkin && checkout && <p className="bk-error" role="alert">Checkout must be after check-in, and check-in from today.</p>}

          {askContact && !user && (
            <div className="bk-contact">
              <p className="bk-contact-lead">Where should our sales desk reach you?</p>
              <label className="bk-row"><span>Name</span>
                <input type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label className="bk-row"><span>Phone</span>
                <input type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></label>
              <label className="bk-row"><span>Email</span>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <Link className="bk-link" href="/plan-ahead?tab=inquiries">Have an account? Sign in</Link>
            </div>
          )}

          {error && <p className="bk-error" role="alert">{error}</p>}

          <button type="submit" className="bk-cta" disabled={!datesOk || sending}>
            {sending ? "Sending" : askContact && !user ? "Send request" : "Request to book"}
          </button>
          <p className="bk-fine">You won&rsquo;t be charged. Our sales desk confirms availability and the final tariff.</p>
        </div>
      </form>

      {/* Phones: the card sits below the details, so a bar keeps the price and action in reach. */}
      <div className={`bk-bar${cardInView ? " is-hidden" : ""}`} aria-hidden={cardInView}>
        <p><strong>{inr(tariff)}</strong> night{nights > 0 && <span> · {inr(total)} est. total</span>}</p>
        <a className="bk-bar-cta" href="#booking-card">Request to book</a>
      </div>
    </>
  );
}
