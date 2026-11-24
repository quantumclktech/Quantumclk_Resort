// Public, non-secret settings (the browser client is public; see KEYCLOAK-SETUP §5.1).

/**
 * Where the API and Keycloak are. Empty/unset = the page's own origin: the ERP (/erp/), Keycloak (/realms,
 * /resources) and the API (/api) always share one origin, split by path by Caddy or the Vite dev proxy (D-124).
 * So the same build works on localhost, the ngrok tunnel and the VPS without baking a hostname in. Set the
 * variable only when the API or Keycloak really live on another host.
 */
export function baseUrl(value: string | undefined, origin = window.location.origin): string {
  const v = value?.trim();
  return (v ? v : origin).replace(/\/+$/, "");
}

export const config = {
  apiUrl: baseUrl(import.meta.env.VITE_API_URL as string | undefined),
  keycloakUrl: baseUrl(import.meta.env.VITE_KEYCLOAK_URL as string | undefined),
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "gh-staff",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "erp-web",
  // The resort's official UPI QR image for "Scan QR" payments. Not supplied by the client yet (Q-031).
  upiQrUrl: (import.meta.env.VITE_UPI_QR_URL as string | undefined) ?? "",
  // One-tap amounts on the registration form, e.g. "25000,30000,50000". Empty (no chips) until the client confirms
  // the Loyalty fee (Q-030); never a guessed price.
  goldFeeChips: (import.meta.env.VITE_GOLD_FEE_CHIPS as string | undefined) ?? "",
};
