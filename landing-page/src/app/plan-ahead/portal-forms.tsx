"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { portalApi, type GuestUser, type InquiryRecord } from "../portal-client";
import { ArrowRight, Check, RefreshCw } from "../icons";
import { getTodayStr, addDays, sanitizeBookingDates } from "../booking-dates";

/* The accommodation the resort actually offers, in the same words the
 * Rooms section of this page uses. The value is sent straight through to the
 * ERP lead record, so it has to read correctly to the sales desk too. */
const ROOM_OPTIONS = [
  "Premium Room — Queen",
  "Premium Room — Twin",
  "Suite Room with Jacuzzi",
  "Wooden Cottage",
  "Dormitory Cottage (10–12 guests)",
  "Private Pool Cottage",
];

/* The four states a lead moves through in the ERP (LeadStatus), said in
 * words a guest can act on rather than the raw enum. */
const STATUS_COPY: Record<string, string> = {
  NEW: "Received",
  IN_PROGRESS: "With our sales team",
  CONVERTED: "Confirmed",
  LOST: "Closed",
};

/* While the tab is open, re-read the inquiry list so a status the sales desk
 * changes in the ERP turns up here without a reload. */
const REFRESH_MS = 20000;

function statusLabel(status: string) {
  return STATUS_COPY[status] ?? status.replace(/_/g, " ").toLowerCase();
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function nightsBetween(from: string, to: string) {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  const n = Math.round((b.getTime() - a.getTime()) / 86400000);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function PortalForms() {
  const [currentUser, setCurrentUser] = useState<GuestUser | null>(null);
  const [activeTab, setActiveTab] = useState<"book" | "account">("book");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isPending, startTransition] = useTransition();

  // Booking form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [roomCategory, setRoomCategory] = useState(ROOM_OPTIONS[0]);
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<InquiryRecord | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Account form
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Inquiries
  const [myInquiries, setMyInquiries] = useState<InquiryRecord[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const loadInquiries = useCallback(async (token: string) => {
    setRefreshing(true);
    try {
      const list = await portalApi.getMyInquiries(token);
      setMyInquiries(list);
      setListError(null);
      setLastSynced(new Date());
    } catch {
      setListError("Could not reach the reservations desk just now");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const user = portalApi.getStoredUser();
    // Room pages link here with ?tab=inquiries to open the guest's inquiry list.
    // The URL is only known in the browser; reading it during render would
    // mismatch the prerendered page on hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).get("tab") === "inquiries") setActiveTab("account");
    if (user) {
      setCurrentUser(user);
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      void loadInquiries(user.token);
    }

    // The home page booking bar sends ?checkin=&checkout=&guests= here.
    const query = new URLSearchParams(window.location.search);
    const qIn = query.get("checkin") ?? "";
    const qOut = query.get("checkout") ?? "";
    const qGuests = Number(query.get("guests"));
    const [validIn, validOut] = sanitizeBookingDates(qIn, qOut);
    setCheckin(validIn);
    setCheckout(validOut);
    if (Number.isInteger(qGuests) && qGuests >= 1 && qGuests <= 12) setGuestCount(qGuests);
  }, [loadInquiries]);

  /* Poll only while the account tab is actually being looked at. */
  useEffect(() => {
    if (!currentUser || activeTab !== "account") return;
    const id = window.setInterval(() => {
      if (!document.hidden) void loadInquiries(currentUser.token);
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [currentUser, activeTab, loadInquiries]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    startTransition(async () => {
      try {
        const u = await portalApi.login(authEmail, authPassword);
        setCurrentUser(u);
        setName(u.name);
        setEmail(u.email);
        setPhone(u.phone);
        void loadInquiries(u.token);
      } catch (err: unknown) {
        setAuthError(err instanceof Error ? err.message : "Could not sign in");
      }
    });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    startTransition(async () => {
      try {
        const u = await portalApi.register(authName, authEmail, authPhone, authPassword);
        setCurrentUser(u);
        setName(u.name);
        setEmail(u.email);
        setPhone(u.phone);
        void loadInquiries(u.token);
      } catch (err: unknown) {
        setAuthError(err instanceof Error ? err.message : "Could not create the account");
      }
    });
  }

  function handleLogout() {
    portalApi.logout();
    setCurrentUser(null);
    setMyInquiries([]);
    setLastSynced(null);
  }

  function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    const todayStr = getTodayStr();
    if (checkin < todayStr) {
      setBookingError("Check-in date cannot be in the past.");
      return;
    }
    if (checkout <= checkin) {
      setBookingError("Check-out date must be after check-in date.");
      return;
    }

    startTransition(async () => {
      try {
        const rec = await portalApi.submitInquiry({
          name,
          email,
          phone,
          checkinDate: checkin,
          checkoutDate: checkout,
          roomCategory,
          guestCount: Number(guestCount),
          notes,
        }, currentUser?.token);

        setBookingSuccess(rec);
        if (currentUser) void loadInquiries(currentUser.token);
      } catch (err: unknown) {
        setBookingError(err instanceof Error ? err.message : "Could not send the inquiry");
      }
    });
  }

  const nights = nightsBetween(checkin, checkout);

  return (
    <div className="portal-container wrap">
      <div className="portal-tabs" role="tablist" aria-label="Guest portal">
        <button
          type="button"
          className={`portal-tab ${activeTab === "book" ? "active" : ""}`}
          onClick={() => setActiveTab("book")}
          role="tab"
          aria-selected={activeTab === "book"}
        >
          Book a stay
        </button>
        <button
          type="button"
          className={`portal-tab ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
          role="tab"
          aria-selected={activeTab === "account"}
        >
          Your inquiries
          {currentUser && myInquiries.length > 0 && (
            <span className="portal-tab-count">{myInquiries.length}</span>
          )}
        </button>
      </div>

      {/* Book a stay */}
      {activeTab === "book" && (
        <section className="portal-section" aria-labelledby="book-heading">
          <div className="portal-grid">
            <div className="portal-info">
              <span className="portal-eyebrow">Reservation inquiry</span>
              <h2 id="book-heading">Tell us when you would like to come</h2>
              <p>
                Send your dates and the accommodation you have in mind. The inquiry reaches
                our sales desk with a reference number, and you can follow what happens to it
                from the inquiries tab.
              </p>

              <ol className="portal-steps">
                <li><span className="portal-step-n">1</span>You send the dates</li>
                <li><span className="portal-step-n">2</span>The sales desk picks it up</li>
                <li><span className="portal-step-n">3</span>We call to confirm availability and tariff</li>
              </ol>

              {currentUser ? (
                <p className="portal-hint">
                  Signed in as {currentUser.name}
                  <button type="button" onClick={handleLogout} className="portal-btn-link">Sign out</button>
                </p>
              ) : (
                <p className="portal-hint">
                  Already have an account?
                  <button
                    type="button"
                    onClick={() => { setActiveTab("account"); setAuthMode("login"); }}
                    className="portal-btn-link"
                  >
                    Sign in
                  </button>
                  to fill this in and track the inquiry
                </p>
              )}
            </div>

            <div className="portal-form-wrapper">
              {bookingSuccess ? (
                <div className="portal-receipt">
                  <div className="portal-receipt-head">
                    <span className="portal-receipt-mark" aria-hidden="true"><Check size={18} /></span>
                    <div>
                      <h3>Inquiry received</h3>
                      <p className="portal-receipt-sub">We have it. Nothing more to do for now</p>
                    </div>
                  </div>

                  <dl className="portal-receipt-rows">
                    <div>
                      <dt>Reference</dt>
                      <dd className="portal-ref">{bookingSuccess.publicReference}</dd>
                    </div>
                    <div>
                      <dt>Accommodation</dt>
                      <dd>{bookingSuccess.roomCategory}</dd>
                    </div>
                    <div>
                      <dt>Dates</dt>
                      <dd>
                        {formatDate(bookingSuccess.checkinDate)} – {formatDate(bookingSuccess.checkoutDate)}
                        <span className="portal-dim">
                          {" "}· {nightsBetween(bookingSuccess.checkinDate, bookingSuccess.checkoutDate)} nights
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Guests</dt>
                      <dd>{bookingSuccess.guestCount}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <span className={`portal-status portal-status-${bookingSuccess.status.toLowerCase()}`}>
                          <span className="portal-dot" aria-hidden="true" />
                          {statusLabel(bookingSuccess.status)}
                        </span>
                      </dd>
                    </div>
                  </dl>

                  <p className="portal-receipt-note">
                    Keep the reference. Quote it when you call, or sign in to see where it has got to.
                  </p>

                  <button
                    type="button"
                    onClick={() => setBookingSuccess(null)}
                    className="portal-btn-secondary"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="portal-form">
                  {bookingError && <p className="portal-error" role="alert">{bookingError}</p>}

                  <div className="portal-row">
                    <label className="portal-field">
                      <span>Full name</span>
                      <input
                        type="text" required value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Rahul Sharma"
                      />
                    </label>
                    <label className="portal-field">
                      <span>Phone</span>
                      <input
                        type="tel" required value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </label>
                  </div>

                  <div className="portal-row">
                    <label className="portal-field">
                      <span>Email</span>
                      <input
                        type="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rahul@example.com"
                      />
                    </label>
                    <label className="portal-field">
                      <span>Guests</span>
                      <input
                        type="number" min="1" max="20" required value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                      />
                    </label>
                  </div>

                  <div className="portal-row">
                    <label className="portal-field">
                      <span>Check in</span>
                      <input
                        type="date"
                        required
                        min={getTodayStr()}
                        value={checkin}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCheckin(val);
                          if (checkout && val >= checkout) {
                            setCheckout(addDays(val, 2));
                          }
                        }}
                      />
                    </label>
                    <label className="portal-field">
                      <span>Check out</span>
                      <input
                        type="date"
                        required
                        min={checkin ? addDays(checkin, 1) : addDays(getTodayStr(), 1)}
                        value={checkout}
                        onChange={(e) => setCheckout(e.target.value)}
                      />
                    </label>
                  </div>

                  {nights > 0 && (
                    <p className="portal-nights">{nights} {nights === 1 ? "night" : "nights"}</p>
                  )}

                  <label className="portal-field">
                    <span>Accommodation</span>
                    <select value={roomCategory} onChange={(e) => setRoomCategory(e.target.value)}>
                      {ROOM_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </label>

                  <label className="portal-field">
                    <span>Anything we should know</span>
                    <textarea
                      rows={3} value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anniversary, airport pick-up, dietary needs"
                    />
                  </label>

                  <button type="submit" disabled={isPending} className="portal-btn-primary">
                    {isPending ? "Sending" : "Send inquiry"} <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Your inquiries */}
      {activeTab === "account" && (
        <section className="portal-section" aria-labelledby="account-heading">
          {currentUser ? (
            <div className="portal-account">
              <div className="portal-account-head">
                <div>
                  <span className="portal-eyebrow">Guest portal</span>
                  <h2 id="account-heading">Your inquiries</h2>
                  <p className="portal-account-id">{currentUser.email} · {currentUser.phone}</p>
                </div>
                <div className="portal-account-actions">
                  <button
                    type="button"
                    onClick={() => void loadInquiries(currentUser.token)}
                    className="portal-btn-ghost"
                    disabled={refreshing}
                  >
                    <RefreshCw size={16} /> {refreshing ? "Checking" : "Refresh"}
                  </button>
                  <button type="button" onClick={handleLogout} className="portal-btn-ghost">
                    Sign out
                  </button>
                </div>
              </div>

              <p className="portal-sync" aria-live="polite">
                {listError
                  ? listError
                  : lastSynced
                    ? `Checked with the reservations desk at ${lastSynced.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
                    : "Checking with the reservations desk"}
              </p>

              {myInquiries.length === 0 ? (
                <div className="portal-empty">
                  <p>No inquiries yet</p>
                  <button type="button" onClick={() => setActiveTab("book")} className="portal-btn-primary">
                    Book a stay <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <ul className="portal-inquiry-list">
                  {myInquiries.map((inq) => (
                    <li key={inq.id} className="portal-inquiry">
                      <div className="portal-inquiry-main">
                        <div className="portal-inquiry-top">
                          <span className="portal-ref">{inq.publicReference}</span>
                          <span className={`portal-status portal-status-${inq.status.toLowerCase()}`}>
                            <span className="portal-dot" aria-hidden="true" />
                            {statusLabel(inq.status)}
                          </span>
                        </div>
                        <h3>{inq.roomCategory}</h3>
                        <p className="portal-inquiry-dates">
                          {formatDate(inq.checkinDate)} – {formatDate(inq.checkoutDate)}
                          <span className="portal-dim">
                            {" "}· {nightsBetween(inq.checkinDate, inq.checkoutDate)} nights · {inq.guestCount} guests
                          </span>
                        </p>
                        {inq.notes && <p className="portal-inquiry-notes">{inq.notes}</p>}
                      </div>
                      <div className="portal-inquiry-side">
                        <span className="portal-dim">Sent {formatDate(inq.createdAt.slice(0, 10))}</span>
                        {inq.claimedBy && <span>Looked after by {inq.claimedBy}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="portal-auth">
              <div className="portal-auth-toggle" role="tablist" aria-label="Account">
                <button
                  type="button" role="tab" aria-selected={authMode === "login"}
                  className={authMode === "login" ? "active" : ""}
                  onClick={() => setAuthMode("login")}
                >
                  Sign in
                </button>
                <button
                  type="button" role="tab" aria-selected={authMode === "register"}
                  className={authMode === "register" ? "active" : ""}
                  onClick={() => setAuthMode("register")}
                >
                  Create account
                </button>
              </div>

              {authError && <p className="portal-error" role="alert">{authError}</p>}

              {authMode === "login" ? (
                <form onSubmit={handleLogin} className="portal-form portal-auth-form">
                  <h3 id="account-heading">Sign in</h3>
                  <p className="portal-auth-sub">To see the inquiries you have already sent</p>
                  <label className="portal-field">
                    <span>Email</span>
                    <input
                      type="email" required value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </label>
                  <label className="portal-field">
                    <span>Password</span>
                    <input
                      type="password" required value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </label>
                  <button type="submit" disabled={isPending} className="portal-btn-primary">
                    {isPending ? "Signing in" : "Sign in"} <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="portal-form portal-auth-form">
                  <h3 id="account-heading">Create account</h3>
                  <p className="portal-auth-sub">So your inquiries stay in one place</p>
                  <label className="portal-field">
                    <span>Full name</span>
                    <input
                      type="text" required value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Priya Sharma"
                    />
                  </label>
                  <label className="portal-field">
                    <span>Email</span>
                    <input
                      type="email" required value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="priya@example.com"
                    />
                  </label>
                  <label className="portal-field">
                    <span>Phone</span>
                    <input
                      type="tel" required value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </label>
                  <label className="portal-field">
                    <span>Password</span>
                    <input
                      type="password" required minLength={6} value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                  </label>
                  <button type="submit" disabled={isPending} className="portal-btn-primary">
                    {isPending ? "Creating" : "Create account"} <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
