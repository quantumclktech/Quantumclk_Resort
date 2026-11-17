import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import SubpageHeader from "../subpage-header";
import PlanStayPortal from "./plan-stay-portal";

export const metadata: Metadata = {
  title: "Plan Your Stay & Guest Portal | Golden Hills Resort",
  description: "Official guest account access, reservation inquiries, and booking portal for Golden Hills Resort, Biligi.",
};

export default function PlanAheadPage() {
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
