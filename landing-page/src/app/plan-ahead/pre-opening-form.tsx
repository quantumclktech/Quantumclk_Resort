"use client";

import { useState } from "react";
import { ArrowRight } from "../icons";

export default function PreOpeningForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    interest: "Accommodations & Private Pool Villas",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate instantaneous client-side registration
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 450);
  };

  if (submitted) {
    return (
      <aside className="pre-opening-card is-success" aria-live="polite">
        <div className="pre-opening-success-badge">✓ Priority Registration Confirmed</div>
        <h2>Thank you, {formData.name || "valued guest"}.</h2>
        <p className="pre-opening-lead">
          You are now registered for pre-opening privilege updates regarding <strong>{formData.interest}</strong>.
        </p>
        <p className="pre-opening-sub">
          Our pre-opening guest relations desk will reach out to you directly via {formData.contact || formData.email || "your contact details"} as soon as preview bookings and charter member privileges go live.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="pre-opening-reset-btn"
        >
          Register another enquiry
        </button>
      </aside>
    );
  }

  return (
    <aside className="pre-opening-card" aria-labelledby="pre-opening-title">
      <div className="pre-opening-header">
        <span className="plan-kicker">Pre-Opening Guest Registry</span>
        <h2 id="pre-opening-title">Register for Pre-Opening Privilege Updates</h2>
        <p>
          Be the first to receive priority booking window notices, introductory package rates, and chartered membership privileges before public operations commence.
        </p>
      </div>

      <form className="pre-opening-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name *</label>
            <input
              id="reg-name"
              type="text"
              required
              placeholder="e.g. Anand Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-contact">Phone or WhatsApp *</label>
            <input
              id="reg-contact"
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              placeholder="anand@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-interest">Primary Area of Interest</label>
            <select
              id="reg-interest"
              value={formData.interest}
              onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
            >
              <option value="Accommodations & Private Pool Villas">Accommodations &amp; Private Pool Villas</option>
              <option value="Full-Day Outings & Family Recreation">Full-Day Outings &amp; Family Recreation</option>
              <option value="Weddings, Milestones & Banquets (Up to 1,000 pax)">Weddings, Milestones &amp; Banquets (Up to 1,000 pax)</option>
              <option value="Corporate Seminars & Team Offsites">Corporate Seminars &amp; Team Offsites</option>
              <option value="Dining Outlets & Special Celebrations">Dining Outlets &amp; Special Celebrations</option>
            </select>
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="pre-opening-submit-btn" disabled={loading}>
            {loading ? "Registering..." : "Register for Pre-Opening Updates"} <ArrowRight size={16} />
          </button>
          <span className="form-privacy-note">
            Your details remain strictly confidential and will only be used for official Golden Hills Resort communications.
          </span>
        </div>
      </form>
    </aside>
  );
}

