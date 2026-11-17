"use client";

import Link from "next/link";
import type { SampleMembership } from "./guest-session";
import { memberBenefits, RESORT_DESK } from "./member-benefits";
import { ArrowRight } from "./icons";

/* /profile, for a real Gold Member (D-123): status and validity, the
 * amenities (from member-benefits.ts, marked "to be confirmed" until the
 * resort approves them, Q-032) and the enrolling executive as concierge.
 * The executive's number is shown only if they chose to share it (WhatsApp
 * opt-in, Q-035); otherwise the resort desk. */

const fmt = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export default function MemberExtras({ membership: m }: { membership: SampleMembership }) {
  const exec = m.executive;
  const phone = exec?.mobile ?? null;
  const wa = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : null;

  return (
    <div className="mx">
      <div className="mx-status">
        <p className="mx-kicker">Status</p>
        <p className="mx-active"><span aria-hidden="true">●</span> Active Gold Member · verified by resort management</p>
        <p className="mx-valid">Valid {fmt(m.validFrom)} – {fmt(m.validTo)}</p>
        <div className="mx-actions">
          <Link href="/plan-ahead" className="prof-link">Book a stay <ArrowRight size={15} /></Link>
          <a href={`tel:${RESORT_DESK.tel}`} className="prof-link">Call the desk</a>
        </div>
      </div>

      <div className="mx-amenities">
        <p className="mx-kicker">Included with Gold</p>
        <ul>
          {memberBenefits.map((b) => (
            <li key={b.title}>
              <strong>{b.title}</strong>
              <span>{b.detail}</span>
              {!b.confirmed && <em>to be confirmed</em>}
            </li>
          ))}
        </ul>
      </div>

      {exec && (
        <div className="mx-concierge">
          <p className="mx-kicker">Your concierge</p>
          <p className="mx-exec"><span className="mx-avatar" aria-hidden="true">{exec.name.trim().charAt(0).toUpperCase() || "G"}</span>
            <span><strong>{exec.name}</strong><small>Enrolled you · {exec.username}</small></span>
          </p>
          <div className="mx-actions">
            {wa ? (
              <>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="prof-link">WhatsApp</a>
                <a href={`tel:${phone}`} className="prof-link">Call</a>
              </>
            ) : (
              <a href={`tel:${RESORT_DESK.tel}`} className="prof-link">Call the resort desk {RESORT_DESK.display}</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
