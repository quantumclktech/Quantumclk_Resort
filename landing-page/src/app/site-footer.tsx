"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sketch } from "./pencil";
import { logo } from "./resort-assets";
import { ArrowUp } from "./icons";

const exploreLinks = [
  { href: "/#story", label: "Brand Story" },
  { href: "/stay", label: "Accommodation" },
  { href: "/#amenities", label: "Amenities" },
  { href: "/dining", label: "Dining" },
  { href: "/experiences", label: "Experiences & Activities" },
  { href: "/gatherings", label: "Celebrations & Banquets" },
  { href: "/membership", label: "Membership Privileges" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#location", label: "Location & Nearby" },
  { href: "/#highlights", label: "Why Choose Us" },
  { href: "/#offers", label: "Offers & Packages" },
];

const planLinks = [
  { href: "/plan-ahead#bookings", label: "Plan your stay" },
  { href: "/membership", label: "Privilege Club intake" },
  { href: "/plan-ahead#enquiries", label: "Group enquiries" },
];

export default function SiteFooter() {
  const pathname = usePathname();

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" onClick={handleLogoClick} aria-label="Golden Hills Resort, home">
              <Image src={logo} alt="" width={2360} height={1120} sizes="132px" />
            </Link>
            <p>Golden Hills Resort brings together stays, dining, recreation and event celebrations in Anagawadi Village, Biligi Taluk, Bagalkote District. All property imagery is an artist&rsquo;s impression by Astu Architects and Rajvi Jhaveri.</p>
            <Sketch name="tree" className="footer-sketch" />
          </div>

          <nav className="footer-col" aria-label="Explore the resort">
            <h2>Explore</h2>
            <div className="footer-list">
              {exploreLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </div>
          </nav>

          <nav className="footer-col" aria-label="Plan your stay">
            <h2>Plan your stay</h2>
            <div className="footer-list">
              {planLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </div>
          </nav>
        </div>

        <div className="footer-bottom">
          <p>Official direct booking and reservation channels will be activated here upon opening. For now, explore the accommodations, dining outlets, amenities and event venues.</p>
          <a className="back-top" href="#top">Back to top <ArrowUp /></a>
        </div>
      </div>
    </footer>
  );
}
