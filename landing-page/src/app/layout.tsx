import type { Metadata, Viewport } from "next";
import "./general-sans.css";
import "@fontsource-variable/inter";
import "./tokens.css";
import "./base.css";
import "./globals.css";
import "./home-visual.css";
import "./subpage.css";
import "./subpage-layouts.css";
import "./stay-editorial.css";
import "./membership.css";
import "./dining.css";
import "./opening.css";
import "./plan-ahead.css";
import "./room-detail.css";
import "./home-opening.css";
import "./experiences.css";
import "./gatherings.css";
import "./stay.css";
import "./profile.css";
import "./mobile.css";
import { PencilDefs } from "./pencil";
import SketchObserver from "./sketch-observer";
import ScrollToTop from "./scroll-to-top";

export const metadata: Metadata = {
  title: "Golden Hills Resort | Stay, dine and gather in Biligi",
  description:
    "Explore rooms, cottages, dining, experiences and gatherings at Golden Hills Resort in Anagawadi, Biligi, Karnataka.",
};

/* Phones colour their browser bar from this: match the header, so the bar
   and the page read as one surface. */
export const viewport: Viewport = {
  themeColor: "#fcfaf6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ScrollToTop />
        <PencilDefs />
        {children}
        <SketchObserver />
      </body>
    </html>
  );
}
