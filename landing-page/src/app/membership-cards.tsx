"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  membershipCategories,
  membershipStats,
  membershipFaqs,
  type MembershipCategory,
} from "./membership-data";
import {
  ChevronDown,
  BedDouble,
  AdventureCompass,
  Utensils,
  WineGlass,
  Users,
  SpaLotus,
  TicketVoucher,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
} from "./icons";
import { getScene, impression } from "./resort-assets";

function CategoryIcon({
  name,
  size = 20,
}: {
  name: MembershipCategory["iconName"];
  size?: number;
}) {
  switch (name) {
    case "BedDouble":
      return <BedDouble size={size} />;
    case "AdventureCompass":
      return <AdventureCompass size={size} />;
    case "Utensils":
      return <Utensils size={size} />;
    case "WineGlass":
      return <WineGlass size={size} />;
    case "Users":
      return <Users size={size} />;
    case "SpaLotus":
      return <SpaLotus size={size} />;
    default:
      return <Sparkles size={size} />;
  }
}

export default function MembershipCards() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCategories =
    activeFilter === "all"
      ? membershipCategories
      : membershipCategories.filter((c) => c.id === activeFilter);

  return (
    <div className="membership-experience">
      {/* Interactive Category Filter Pills */}
      <div className="membership-filters-bar wrap" role="toolbar" aria-label="Filter privileges by category">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`mem-filter-pill ${activeFilter === "all" ? "mem-filter-pill--active" : ""}`}
        >
          All Privileges (180)
        </button>
        {membershipCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveFilter(cat.id)}
            className={`mem-filter-pill ${activeFilter === cat.id ? "mem-filter-pill--active" : ""}`}
          >
            {cat.shortName} ({cat.totalBenefits})
          </button>
        ))}
      </div>

      {/* Privilege Cards Grid */}
      <div className="wrap membership-grid">
        {filteredCategories.map((category) => {
          const isExpanded = !!expandedCards[category.id];
          const scene = getScene(category.sceneId);

          return (
            <article
              key={category.id}
              className={`ref-card mem-card ${isExpanded ? "mem-card--expanded" : ""}`}
              aria-expanded={isExpanded}
            >
              {/* Card Image Banner */}
              <div className="rc-media mem-media">
                <div className="rc-media-frame">
                  <Image
                    src={scene.src}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
                    className="rc-media-img"
                  />
                  <div className="mem-badge-overlay">
                    <span className="mem-icon-badge">
                      <CategoryIcon name={category.iconName} size={16} />
                    </span>
                    <span className="mem-count-badge">
                      {category.totalBenefits} {category.couponsCount > 0 && category.vouchersCount > 0 ? "Privileges" : category.vouchersCount > 0 ? "Vouchers" : "Coupons"}
                    </span>
                  </div>
                  <p className="rc-caption">{impression}</p>
                </div>
              </div>

              {/* Card Content & Summary */}
              <div className="rc-content mem-content">
                <div className="mem-header-row">
                  <span className="mem-kicker">{category.tagline}</span>
                  {category.vouchersCount > 0 && (
                    <span className="mem-sub-badge">
                      {category.vouchersCount} Vouchers
                    </span>
                  )}
                  {category.couponsCount > 0 && (
                    <span className="mem-sub-badge mem-sub-badge--coupon">
                      {category.couponsCount} Coupons
                    </span>
                  )}
                </div>

                <h2 className="rc-title mem-title">{category.name}</h2>

                {/* Key Takeaways (Bullet points - concise, not overwhelming) */}
                <div className="mem-highlights-list">
                  {category.highlights.map((item, idx) => (
                    <div key={idx} className="mem-highlight-item">
                      <ShieldCheck size={15} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Interactive Dropdown Button */}
                <button
                  type="button"
                  onClick={() => toggleExpand(category.id)}
                  className="rc-toggle-btn mem-toggle-btn"
                  aria-expanded={isExpanded}
                >
                  <span>{isExpanded ? "Hide Details & Terms" : "View All Vouchers & Coupons"}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                    }}
                  />
                </button>

                {/* Expandable Dropdown Drawer */}
                {isExpanded && (
                  <div className="rc-drawer mem-drawer">
                    <div className="mem-drawer-section">
                      <h3 className="mem-drawer-title">
                        <TicketVoucher size={15} /> Included Vouchers &amp; Coupons
                      </h3>
                      <div className="mem-privileges-table">
                        {category.privileges.map((item, pIdx) => (
                          <div key={pIdx} className="mem-privilege-row">
                            <div className="mem-privilege-header">
                              <span className="mem-privilege-qty">{item.count}×</span>
                              <strong className="mem-privilege-name">{item.title}</strong>
                              {item.badge && <span className="mem-privilege-tag">{item.badge}</span>}
                            </div>
                            <p className="mem-privilege-desc">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mem-drawer-section">
                      <h3 className="mem-drawer-title">
                        <Clock size={15} /> Redemption &amp; Usage Terms
                      </h3>
                      <ul className="mem-terms-list">
                        {category.redemptionTerms.map((term, tIdx) => (
                          <li key={tIdx}>{term}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mem-drawer-footer">
                      <Link href="#inquire" className="mem-claim-action">
                        Inquire About This Privilege <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Member Welcome Gift Kit Section */}
      <section className="wrap mem-kit-section" aria-labelledby="kit-title">
        <div className="mem-kit-card">
          <div className="mem-kit-info">
            <span className="mem-kicker">Complimentary On Enrollment</span>
            <h2 id="kit-title" className="mem-kit-title">
              Executive Welcome Gift Box
            </h2>
            <p className="mem-kit-desc">
              Every Golden Hills Resort Privilege Club member receives our signature keepsake kit upon enrollment, designed for effortless resort visits and travel:
            </p>
            <div className="mem-kit-items">
              {membershipStats.welcomeKitItems.map((item, idx) => (
                <div key={idx} className="mem-kit-item">
                  <Sparkles size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mem-kit-badge-row">
              <span className="mem-kit-pill">12 Months Full Validity</span>
              <span className="mem-kit-pill">Fully Transferable</span>
              <span className="mem-kit-pill">Zero Blackout on Weekdays</span>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section className="wrap mem-faq-section" aria-labelledby="faq-title">
        <div className="mem-faq-header">
          <span className="mem-kicker">Privilege Club FAQ</span>
          <h2 id="faq-title" className="mem-faq-title">
            Everything you need to know about membership.
          </h2>
        </div>
        <div className="mem-faq-list">
          {membershipFaqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`mem-faq-item ${isOpen ? "mem-faq-item--open" : ""}`}>
                <button
                  type="button"
                  className="mem-faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s ease",
                    }}
                  />
                </button>
                {isOpen && (
                  <div className="mem-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

