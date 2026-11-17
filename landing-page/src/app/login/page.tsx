import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import SubpageHeader from "../subpage-header";
import PlanStayPortal from "../plan-ahead/plan-stay-portal";

export const metadata: Metadata = {
  title: "Sign In | Golden Hills Resort & Spa",
  description: "Official guest sign-in, booking lookup, and privilege club portal for Golden Hills Resort, Biligi.",
};

/* The same sign-in screen as Plan your stay (and the signed-out /profile). */
export default function LoginPage() {
  return (
    <>
      <SubpageHeader />
      <main id="top" className="plan-main">
        <PlanStayPortal />
      </main>
      <SiteFooter />
    </>
  );
}
