import type { Metadata } from "next";
import ActivateMember from "./activate-member";

/* The welcome-email link (D-121, D-122): /member/activate?t=<one-time token>.
 * It hands the member straight to the secure Golden Hills sign-in, where they
 * set a password once and come back signed in on /membership. */

export const metadata: Metadata = {
  title: "Welcome to the Privilege Club | Golden Hills Resort",
  description: "Set your password and open your Gold Membership.",
  robots: { index: false },
};

export default function ActivatePage() {
  return (
    <main id="top" className="prof-page">
      <ActivateMember />
    </main>
  );
}
