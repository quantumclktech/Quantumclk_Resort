import { defineConfig } from "vitest/config"; // vite config + the `test` section
import react from "@vitejs/plugin-react";

// Keycloak and the API are proxied, so ONE public hostname (a tunnel) can serve the app, the login
// pages and /api/v1 with no CORS and no cross-site cookies. The targets stay internal; the tunnel
// never has to reach the public hostname itself. (No env vars here: `process` is not typed in this
// project and the dev targets do not need overriding.)
const keycloak = { target: "http://localhost:8081", changeOrigin: true, xfwd: true };
const api = { target: "http://localhost:8082", changeOrigin: true, xfwd: true };

export default defineConfig({
  // The ERP is served under /erp/: one public origin is shared with the landing page (at /), Keycloak
  // (/realms, /resources) and the API (/api), split by path in infra/proxy/Caddyfile (D-124).
  base: "/erp/",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // the Keycloak client only allows this origin in dev
    allowedHosts: [".ngrok-free.dev"], // the tunnel forwards its own Host header
    hmr: { clientPort: 443 }, // HMR through HTTPS: wss://<tunnel>:443, not :5173
    proxy: { "/realms": keycloak, "/resources": keycloak, "/api": api },
  },
  test: { environment: "jsdom" },
});
