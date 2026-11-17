"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logo, logoLight } from "./resort-assets";
import { ArrowRight } from "./icons";
import { useSession } from "./guest-session";

/* Signed in: the guest's initial, linking to their profile. Signed out: a
 * quiet "Sign in" text link (unit 3.30). */
function ProfileLink() {
  const session = useSession();
  if (!session) {
    return <Link href="/profile" className="site-navbar-profile">Sign in</Link>;
  }
  return (
    <Link href="/profile" className="site-navbar-profile is-in" aria-label={`Your profile, ${session.user.name}`}>
      <span aria-hidden="true">{session.user.name.trim().charAt(0).toUpperCase() || "G"}</span>
    </Link>
  );
}

const navLinks = [
  { href: "/stay", label: "Stay" },
  { href: "/dining", label: "Dining" },
  { href: "/experiences", label: "Experiences" },
  { href: "/gatherings", label: "Gatherings" },
  { href: "/membership", label: "Membership" },
  { href: "/#amenities", label: "Amenities" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#location", label: "Location" },
  { href: "/#story", label: "Story" },
];

const mobileExploreLinks = [
  { href: "/", label: "Home" },
  { href: "/stay", label: "Stay (Accommodations)" },
  { href: "/dining", label: "Dining & Lounges" },
  { href: "/experiences", label: "Signature Experiences" },
  { href: "/gatherings", label: "Gatherings & Banquets" },
  { href: "/membership", label: "Membership Privileges" },
  { href: "/#amenities", label: "Amenities & Recreation" },
  { href: "/#gallery", label: "Resort Gallery" },
  { href: "/#location", label: "Location & Heritage" },
  { href: "/#story", label: "Brand Story" },
];

/* `overlay` (home only, unit 3.22): the bar starts see-through over the
 * opening photograph with the light logo, and turns solid after the first
 * 40px of scroll. Colour and background change only, nothing moves. */
export default function SubpageHeader({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const [clear, setClear] = useState(overlay);

  useEffect(() => {
    if (!overlay) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      setClear(window.scrollY < 40);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [overlay]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    }
    function onResize() {
      if (window.innerWidth >= 1120 && menu.current) menu.current.open = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function close() {
    if (menu.current) menu.current.open = false;
  }

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }

  return (
    <header className={`site-navbar-header${overlay ? " is-overlay" : ""}${clear ? " is-clear" : ""}`} role="banner">
      <div className="wrap site-navbar-inner">
        {/* Top-Left Corner: Brand Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="site-navbar-logo"
          aria-label="Golden Hills Resort, return home"
        >
          <Image
            src={logo}
            alt="Golden Hills Resort"
            width={2360}
            height={1120}
            priority
            sizes="136px"
            className="site-navbar-logo-dark"
          />
          {overlay && (
            <Image
              src={logoLight}
              alt=""
              width={2360}
              height={1120}
              sizes="136px"
              className="site-navbar-logo-light"
            />
          )}
        </Link>

        {/* Center: Clean & Readable Desktop Navigation Buttons */}
        <nav className="site-navbar-links" aria-label="Main resort navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`site-navbar-link ${isActive ? "site-navbar-link--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Primary Call to Action & Mobile Menu */}
        <div className="site-navbar-actions">
          <ProfileLink />
          <Link href="/plan-ahead#bookings" className="site-navbar-cta">
            Plan your stay
          </Link>

          <details ref={menu} className="opening-menu site-navbar-mobile-menu">
            <summary aria-label="Toggle navigation menu">
              <span className="opening-menu-label">Menu</span>
              <span className="opening-menu-lines" aria-hidden="true">
                <i />
                <i />
              </span>
            </summary>
            <nav className="opening-mobile-nav" aria-label="Mobile navigation">
              <div className="wrap opening-mobile-nav-inner">
                <div className="opening-mobile-group">
                  <p>Explore Golden Hills</p>
                  {mobileExploreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        close();
                        if (link.href === "/") {
                          handleLogoClick(e);
                        }
                      }}
                    >
                      {link.label}
                      <ArrowRight />
                    </Link>
                  ))}
                </div>
                <div className="opening-mobile-group opening-mobile-actions">
                  <p>Reservations &amp; Access</p>
                  <Link href="/profile" onClick={close}>
                    Your profile
                    <ArrowRight />
                  </Link>
                  <Link href="/plan-ahead#bookings" onClick={close}>
                    Plan your stay
                    <ArrowRight />
                  </Link>
                  <Link href="/#location" onClick={close}>
                    Resort Location
                    <ArrowRight />
                  </Link>
                </div>
                <p className="opening-mobile-note">
                  Golden Hills Resort · Stay · Dine · Gather · Biligi, Bagalkote
                </p>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

