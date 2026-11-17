import type { Metadata } from "next";
import LoginPortal from "../plan-ahead/login-portal";

export const metadata: Metadata = {
  title: "Sign In | Golden Hills Resort & Spa",
  description: "Official guest sign-in, booking lookup, and privilege club portal for Golden Hills Resort, Biligi.",
};

export default function LoginPage() {
  return (
    <main className="login-page-root">
      <LoginPortal />
    </main>
  );
}

