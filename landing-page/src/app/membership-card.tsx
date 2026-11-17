"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { logoLight } from "./resort-assets";
import { useMotionPreference } from "./motion-provider";
import { useSession } from "./guest-session";

/* The membership card, built in code rather than photographed (unit 3.19).
 * This is the page's one bright element: brass foil on forest board, a
 * serial number and the real wordmark. It leans toward the pointer so it
 * reads as an object with weight, not a picture of one. */

export default function MembershipCard({ vouchers, coupons }: { vouchers: number; coupons: number }) {
  const reduced = useMotionPreference();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function lean(event: React.PointerEvent) {
    if (reduced || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    setTilt({ x: -py * 9, y: px * 12 });
  }

  const pad = (n: number) => String(n).padStart(3, "0");
  /* Signed in as a member (unit 3.30): the card becomes theirs — name and
   * number engraved, and the serial shows what is left rather than the
   * booklet's total. Usage is sample data; the panel below says so. */
  const member = useSession()?.membership ?? null;
  const left = member
    ? Object.values(member.used).reduce(
        (acc, u) => ({ v: acc.v - u.vouchers, c: acc.c - u.coupons }),
        { v: vouchers, c: coupons },
      )
    : null;

  return (
    <div
      className="mcard-stage"
      onPointerMove={lean}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div
        ref={ref}
        className="mcard"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="mcard-face">
          <div className="mcard-top">
            <Image src={logoLight} alt="" width={132} height={44} className="mcard-logo" />
            <span className="mcard-kind">Charter member</span>
          </div>

          <div className="mcard-chip" aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          {member && (
            <div className="mcard-holder" key={member.membershipNo}>
              <p className="mcard-name">{member.holder}</p>
              <p className="mcard-no">{member.membershipNo}</p>
            </div>
          )}

          <div className="mcard-foot">
            <p className="mcard-serial">{pad(left ? left.v : vouchers)} <i>/</i> {pad(left ? left.c : coupons)}</p>
            <p className="mcard-serial-label">{left ? "Vouchers / coupons left" : "Vouchers / coupons"}</p>
          </div>
        </div>
        <span className="mcard-sheen" aria-hidden="true" />
      </div>
      <p className="mcard-caption">Card artwork is indicative</p>
    </div>
  );
}
