"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type MotionValue } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { logo } from "./resort-assets";
import { ArrowRight } from "./icons";

const desktopLinks = [
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

const mobileLinks = [
  { href: "/stay", label: "Stay (Accommodations)" },
  { href: "/dining", label: "Dining" },
  { href: "/experiences", label: "Experiences & Activities" },
  { href: "/gatherings", label: "Celebrations & Banquets" },
  { href: "/membership", label: "Membership Privileges" },
  { href: "/#amenities", label: "Amenities & Recreation" },
  { href: "/#gallery", label: "Resort Gallery" },
  { href: "/#location", label: "Location & Heritage" },
  { href: "/#story", label: "Brand Story" },
  { href: "/#highlights", label: "Why Choose Us" },
  { href: "/#offers", label: "Offers & Packages" },
];

const menuActions = [
  { href: "/plan-ahead#bookings", label: "Plan your stay" },
  { href: "#location", label: "Find us" },
];

export default function SiteHeader({
  enhanced,
  revealed,
  chrome,
  children,
}: {
  enhanced: boolean;
  revealed: boolean;
  chrome: MotionValue<number>;
  children: ReactNode;
}) {
  const menu = useRef<HTMLDetailsElement>(null);

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

  return (
    <header className="site-header opening-masthead" role="banner" data-settled={revealed || undefined}>
      <motion.div
        className="opening-chrome"
        inert={enhanced && !revealed}
        style={enhanced ? { opacity: chrome } : undefined}
      >
        <div className="wrap site-navbar-inner">
          {/* Top-Left Corner: Logo Slot */}
          <div className="site-navbar-logo-slot">
            {!enhanced && (
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                }}
                className="site-navbar-logo"
                aria-label="Golden Hills Resort, return to top"
              >
                <Image
                  src={logo}
                  alt="Golden Hills Resort"
                  width={2360}
                  height={1120}
                  priority
                  sizes="136px"
                />
              </Link>
            )}
          </div>

          {/* Center: Desktop Navigation Buttons */}
          <nav className="site-navbar-links opening-desktop" aria-label="Resort navigation">
            {desktopLinks.map((link) => (
              <a key={link.href} href={link.href} className="site-navbar-link">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: Primary Call to Action Button & Mobile Menu */}
          <div className="site-navbar-actions">
            <Link className="site-navbar-cta" href="/plan-ahead#bookings">
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
                    <p>Explore the resort</p>
                    {mobileLinks.map((link) => (
                      <a key={link.href} href={link.href} onClick={close}>
                        {link.label}
                        <ArrowRight />
                      </a>
                    ))}
                  </div>
                  <div className="opening-mobile-group opening-mobile-actions">
                    <p>Plan your stay</p>
                    {menuActions.map((link) => (
                      <Link key={link.href} href={link.href} onClick={close}>
                        {link.label}
                        <ArrowRight />
                      </Link>
                    ))}
                  </div>
                  <p className="opening-mobile-note">
                    Explore the rooms, dining, experiences and offers available at Golden Hills Resort.
                  </p>
                </div>
              </nav>
            </details>
          </div>
        </div>
      </motion.div>
      {children}
    </header>
  );
}
