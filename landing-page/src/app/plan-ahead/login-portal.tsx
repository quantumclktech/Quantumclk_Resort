"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { logo, logoLight, getScene } from "../resort-assets";
import type { GuestUser } from "../portal-client";
import { register as keycloakRegister, signIn } from "../guest-auth";
import { signOut as endSession, useSession } from "../guest-session";

const LOGIN_SCENES = [
  { id: "dusk-pool-candidate-p38", title: "Golden Hills Resort Dusk Pool & Cottages" },
  { id: "cottage-pool-terrace-p34", title: "Private Poolside Cottage & Daybed Terrace" },
  { id: "suite-master-bed-p18", title: "Master Suite Room with Jacuzzi Bath" },
  { id: "cottage-entry-p32", title: "Standalone Timber Cottage & Wellness Enclave" },
  { id: "hero-pool-day-desktop-p37", title: "Central Colonnade Infinity Pool & Sun Terrace" },
];

export default function LoginPortal() {
  // Main view mode: "login" or "register"
  const [viewMode, setViewMode] = useState<"login" | "register">("login");

  // Automatic 4-second slideshow for the visual image card
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % LOGIN_SCENES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlideIdx]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);   // the guest must tick it themselves

  // Common UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentUser, setCurrentUser] = useState<GuestUser | null>(null);

  const heroScene = getScene("dusk-pool-candidate-p38");

  // A real sign-in (Keycloak, gh-guests; D-119) shows the same signed-in card.
  const session = useSession();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) setCurrentUser(session.user);
  }, [session]);

  // -------------------------------------------------------------------------
  // Sign In: opens the secure Golden Hills (Keycloak) page
  // -------------------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!loginEmail || !loginEmail.includes("@")) {
      setErrorMsg("Please enter a valid guest email address.");
      return;
    }
    // The password is typed on the secure Golden Hills page (Keycloak), never here.
    setIsLoading(true);
    try {
      await signIn(loginEmail.trim(), "/membership?welcome=1");
    } catch {
      setErrorMsg("We could not reach the sign-in service. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Register: account is created on the Keycloak registration page
  // -------------------------------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!regName.trim() || regName.trim().length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!regEmail || !regEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    // The account (with its password) is created on the secure Golden Hills page (Keycloak registration).
    setIsLoading(true);
    try {
      await keycloakRegister("/membership?welcome=1");
    } catch {
      setErrorMsg("We could not reach the sign-in service. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Sign Out Handler
  // -------------------------------------------------------------------------
  const handleSignOut = () => {
    endSession();   // also ends a Keycloak session and clears old browser data (guest-session.ts)
    setCurrentUser(null);
    setSuccessMsg("You have signed out safely.");
    setErrorMsg("");
  };

  return (
    <div className="login-screen-wrapper">
      {/* =========================================================================
          LEFT / HERO VISUAL PANEL (Desktop) with 4-Second Slideshow
          ========================================================================= */}
      <div className="login-hero-panel">
        {(() => {
          const currentSlide = LOGIN_SCENES[heroSlideIdx];
          const scene = getScene(currentSlide.id);
          return (
            <Image
              key={currentSlide.id}
              src={scene.src}
              alt={currentSlide.title}
              fill
              priority
              sizes="(max-width: 960px) 100vw, 50vw"
              className="login-hero-image"
            />
          );
        })()}
        <div className="login-hero-scrim" />

        <div className="login-hero-content">
          <div className="login-hero-brand">
            <Link href="/" className="login-hero-logo-link" aria-label="Golden Hills Resort Home">
              <Image
                src={logoLight}
                alt="Golden Hills Resort"
                width={190}
                height={90}
                className="login-hero-logo"
              />
            </Link>
          </div>

          <div className="login-hero-message">
            <span className="login-hero-kicker">
              {viewMode === "register" ? "Create Guest Folio" : "Official Guest & Member Portal"}
            </span>
            <h1 className="login-hero-title">
              {viewMode === "register"
                ? "Join the circle of peaceful hospitality."
                : "Where Northern Karnataka's heritage meets serene luxury."}
            </h1>
            <p className="login-hero-desc">
              {viewMode === "register"
                ? "Register today for personalized villa stays, dining reservations, and complimentary enrollment in the Golden Hills Privilege Club with 180 vouchers."
                : "Manage your villa reservations, unlock 180 Privilege Club vouchers, reserve specialized dining tables, and access personalized stay concierge services."}
            </p>

            <div className="login-hero-perks">
              <div className="login-perk-item">
                <span className="login-perk-dot" />
                <span>Verified Reservation Management &amp; Direct Invoicing</span>
              </div>
              <div className="login-perk-item">
                <span className="login-perk-dot" />
                <span>Privilege Club Digital Voucher Ledger &amp; Dining Passes</span>
              </div>
              <div className="login-perk-item">
                <span className="login-perk-dot" />
                <span>24/7 Resort Concierge &amp; Itinerary Customization</span>
              </div>
            </div>
          </div>

          <div className="login-hero-footer">
            <div className="login-security-indicator">
              <span className="security-icon-dot" />
              <span>Connected to Golden Hills ERP Backend (:8082) · SSL Protected</span>
            </div>
            <Link href="/" className="login-hero-back-link">
              <ArrowLeft size={14} />
              <span>Back to Main Site</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT / AUTHENTICATION FORM PANEL
          ========================================================================= */}
      <div className="login-form-panel">
        <div className="login-form-container">
          {/* Mobile Top Bar */}
          <div className="login-top-bar">
            <Link href="/" className="login-back-button" aria-label="Return to resort homepage">
              <ArrowLeft size={16} />
              <span>Return to Resort</span>
            </Link>
            <div className="login-top-logo">
              <Image
                src={logo}
                alt="Golden Hills"
                width={120}
                height={55}
                className="login-mobile-brand-img"
              />
            </div>
          </div>

          {/* Active Logged-in State Card */}
          {currentUser ? (
            <div className="login-success-card">
              <div className="success-badge-icon">
                <CheckCircle2 size={40} color="var(--color-forest)" />
              </div>
              <span className="login-header-tag">Authenticated Session</span>
              <h3>Welcome, {currentUser.name}</h3>
              <p className="success-user-email">{currentUser.email}</p>
              <p className="success-instruction">
                Your guest profile is active and synced with Golden Hills ERP. You can explore accommodations, check dining options, or review reservations.
              </p>
              <div className="success-actions">
                <Link href="/stay" className="login-primary-btn">
                  <span>Explore Accommodations</span>
                  <ArrowRight size={16} />
                </Link>
                <Link href="/membership" className="login-secondary-btn">
                  <span>View Privilege Vouchers</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="login-logout-link"
                >
                  Sign Out of Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header with Switcher: Sign In vs Create Account */}
              <div className="login-header">
                <div className="login-mode-switch-row">
                  <span className="login-header-tag">
                    {viewMode === "register" ? "New Guest Registration" : "Guest Sign In"}
                  </span>
                  <div className="login-mode-pills" role="group" aria-label="Sign in or Register">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("login");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className={`login-mode-pill ${viewMode === "login" ? "active" : ""}`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("register");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className={`login-mode-pill ${viewMode === "register" ? "active" : ""}`}
                    >
                      Register
                    </button>
                  </div>
                </div>

                <h2 className="login-title">
                  {viewMode === "register" ? "Create your guest account" : "Sign in to your stay"}
                </h2>
                <p className="login-subtitle">
                  {viewMode === "register"
                    ? "Fill in your details below to register your guest account and access member rates."
                    : "Welcome back. Access your bookings, dining reservations, and member perks."}
                </p>
              </div>

              {/* Status / Error Alerts */}
              {errorMsg && (
                <div className="login-alert login-alert-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="login-alert login-alert-success" role="status">
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* =============================================================
                  VIEW 1: REGISTRATION FORM
                  ============================================================= */}
              {viewMode === "register" ? (
                <form onSubmit={handleRegisterSubmit} className="login-form" noValidate>
                  <div className="login-field-group">
                    <label htmlFor="reg-name" className="login-label">
                      Full Name *
                    </label>
                    <div className="login-input-wrapper">
                      <User size={17} className="login-input-icon" />
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Rohan Sharma"
                        className="login-input"
                      />
                    </div>
                  </div>

                  <div className="login-field-group">
                    <label htmlFor="reg-email" className="login-label">
                      Email Address *
                    </label>
                    <div className="login-input-wrapper">
                      <Mail size={17} className="login-input-icon" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="rohan.sharma@example.com"
                        className="login-input"
                      />
                    </div>
                  </div>

                  <div className="login-field-group">
                    <label htmlFor="reg-phone" className="login-label">
                      Mobile Number (for SMS &amp; Booking Alerts) *
                    </label>
                    <div className="login-input-wrapper login-phone-wrapper">
                      <span className="login-phone-prefix">🇮🇳 +91</span>
                      <input
                        id="reg-phone"
                        type="tel"
                        maxLength={10}
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="98765 43210"
                        className="login-input login-input-phone"
                      />
                    </div>
                  </div>

                  <p className="login-secure-note">
                    <Lock size={15} /> Next you choose your password on the secure Golden Hills page and confirm your email.
                  </p>

                  <div className="login-options-row">
                    <label className="login-checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="login-checkbox"
                      />
                      <span>I agree to the Terms of Service &amp; Privacy Policy</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="login-primary-btn"
                  >
                    {isLoading ? (
                      <span className="login-btn-loading">
                        <span className="login-spinner" />
                        <span>Creating Account...</span>
                      </span>
                    ) : (
                      <>
                        <span>Create Guest Account</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="login-footer-pitch">
                    <p>
                      Already registered?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("login");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="login-signup-link-btn"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* =============================================================
                   VIEW 2: SIGN IN (email → Keycloak; D-142 removed the preview-only options)
                   ============================================================= */
                <>
                  {/* Email sign-in: the password is typed on the secure Golden Hills (Keycloak) page */}
                  <form onSubmit={handleLoginSubmit} className="login-form" noValidate>
                      <div className="login-field-group">
                        <label htmlFor="login-email" className="login-label">
                          Email Address
                        </label>
                        <div className="login-input-wrapper">
                          <Mail size={17} className="login-input-icon" />
                          <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="guest@example.com"
                            className="login-input"
                          />
                        </div>
                      </div>

                      <div className="login-field-group">
                        <div className="login-label-row">
                          <span className="login-label">Password</span>
                          <button
                            type="button"
                            onClick={() => void signIn(loginEmail.trim(), "/membership?welcome=1")}
                            className="login-forgot-link"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <p className="login-secure-note">
                          <Lock size={15} /> Next, on the secure Golden Hills page, enter the password you set from your welcome email.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="login-primary-btn"
                      >
                        {isLoading ? (
                          <span className="login-btn-loading">
                            <span className="login-spinner" />
                            <span>Verifying credentials...</span>
                          </span>
                        ) : (
                          <>
                            <span>Sign In to Guest Portal</span>
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>

                    </form>

                  {/* New Guest Registration Callout Card */}
                  <div className="login-register-prompt-card">
                    <div className="register-prompt-content">
                      <div className="register-prompt-header">
                        <span className="register-prompt-badge">New Guest?</span>
                        <h4 className="register-prompt-title">Don&apos;t have an account yet?</h4>
                      </div>
                      <p className="register-prompt-desc">
                        Register in 30 seconds to manage reservations, check in online, and receive 180 complimentary Privilege Club vouchers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("register");
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="login-register-now-btn"
                      aria-label="Register a new guest account"
                    >
                      <UserPlus size={16} />
                      <span>Register Now</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>

                  <div className="login-footer-pitch">
                    <div className="login-concierge-help">
                      <span>Need assistance with your reservation?</span>
                      <a href="tel:+918353200100" className="login-phone-link">
                        Concierge Desk: +91 8353 200 100
                      </a>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Privacy & Trust Badge */}
          <div className="login-trust-bar">
            <span>🛡️ Protected by Golden Hills Hospitality Security Protocol · SSL Encrypted</span>
          </div>
        </div>
      </div>

    </div>
  );
}
