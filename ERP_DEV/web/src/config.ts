// Public, non-secret settings (the browser client is public; see KEYCLOAK-SETUP §5.1).
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8082",
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8081",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "gh-staff",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "erp-web",
  // The resort's official UPI QR image for "Scan QR" payments. Not supplied by the client yet (Q-031).
  upiQrUrl: (import.meta.env.VITE_UPI_QR_URL as string | undefined) ?? "",
  // One-tap amounts on the registration form, e.g. "25000,30000,50000". Empty (no chips) until the client confirms
  // the Gold fee (Q-030); never a guessed price.
  goldFeeChips: (import.meta.env.VITE_GOLD_FEE_CHIPS as string | undefined) ?? "",
};
