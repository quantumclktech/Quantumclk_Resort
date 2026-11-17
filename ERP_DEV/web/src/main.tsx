import { StrictMode, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { initAuth, session } from "./auth";
import { createApi, type Me } from "./api";
import { Dashboard, SignIn } from "./App";
import "./styles.css";

function Root({ signedIn }: { signedIn: boolean }) {
  const request = useMemo(() => createApi(session), []);
  const loadMe = useCallback(() => request<Me>("/api/v1/me"), [request]);
  return signedIn
    ? <Dashboard loadMe={loadMe} request={request} onSignOut={() => void session.logout()} />
    : <SignIn onSignIn={() => void session.login()} />;
}

initAuth().then(
  (signedIn) => createRoot(document.getElementById("root")!).render(<StrictMode><Root signedIn={signedIn} /></StrictMode>),
  () => {
    document.getElementById("root")!.textContent = "The sign-in service is not reachable. Try again in a minute.";
  },
);
