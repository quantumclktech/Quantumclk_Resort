import type { Metadata } from "next";
import SubpageHeader from "../subpage-header";
import SiteFooter from "../site-footer";
import ProfileView from "../profile-view";

export const metadata: Metadata = {
  title: "Your profile | Golden Hills Resort",
  description: "Your Golden Hills Resort bookings and membership.",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <>
      <SubpageHeader />
      <main id="top" className="prof-page">
        <ProfileView />
      </main>
      <SiteFooter />
    </>
  );
}
