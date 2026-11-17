"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck } from "../icons";

export default function MembershipInquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    interest: "Family Stays & Vacation Privileges",
    groupType: "Individual / Family",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 450);
  };

  if (submitted) {
    return (
      <div className="pre-opening-card is-success" aria-live="polite">
        <div className="pre-opening-success-badge">✓ Membership Registration Received</div>
        <h2>Thank you, {formData.name || "valued guest"}.</h2>
        <p className="pre-opening-lead">
          Your charter membership inquiry for <strong>{formData.interest}</strong> has been prioritized.
        </p>
        <p className="pre-opening-sub">
          A Golden Hills Club Relations Executive will contact you via {formData.contact || formData.email || "your provided contact"} with the complete digital voucher prospectus and charter enrollment kit.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="pre-opening-reset-btn"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <div className="pre-opening-card" aria-labelledby="form-heading">
      <div className="pre-opening-header">
        <h3 id="form-heading" className="pre-opening-title">
          Charter Member Enrollment Form
        </h3>
        <p className="pre-opening-description">
          Receive priority allocation for the 180-voucher Golden Hills Privilege Club kit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="pre-opening-form">
        <div className="form-group">
          <label htmlFor="mem-name">Full Name *</label>
          <input
            id="mem-name"
            type="text"
            required
            placeholder="e.g. Ramesh Kulkarni"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="mem-contact">WhatsApp / Phone Number *</label>
          <input
            id="mem-contact"
            type="tel"
            required
            placeholder="+91 98765 43210"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="mem-email">Email Address</label>
          <input
            id="mem-email"
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="mem-interest">Primary Privilege Interest</label>
          <select
            id="mem-interest"
            value={formData.interest}
            onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
          >
            <option value="Family Stays & Vacation Privileges">Family Stays &amp; Vacation Privileges (12 Stay Vouchers)</option>
            <option value="Gourmet Dining & Sunday Brunches">Gourmet Dining &amp; Sunday Brunches (70 F&amp;B Benefits)</option>
            <option value="Day Outings & Weekend Recreation">Day Outings &amp; Weekend Recreation (25 Passes)</option>
            <option value="Celebrations & Banquet Hosting">Celebrations &amp; Banquet Hosting (Up to 6 Free Rooms)</option>
            <option value="Ayurvedic Spa & Wellness Rejuvenation">Ayurvedic Spa &amp; Wellness Rejuvenation</option>
            <option value="Complete All-Round Membership">Complete All-Round Membership (180 Total Privileges)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="pre-opening-submit-btn"
          style={{ width: "100%", justifyContent: "center", minHeight: "48px", marginTop: "12px" }}
        >
          {loading ? "Registering..." : "Submit Membership Inquiry"} <ArrowRight size={16} />
        </button>

        <p className="pre-opening-secure-note" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--color-muted)", marginTop: "12px" }}>
          <ShieldCheck size={14} /> Strict privacy: Your details will only be used by resort guest relations.
        </p>
      </form>
    </div>
  );
}

