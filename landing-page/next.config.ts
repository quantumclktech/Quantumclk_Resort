import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development through a public HTTPS tunnel: the landing page is served at "/" of one shared ngrok
  // origin (staff ERP at /erp/, Keycloak at /realms, API at /api; ERP_DEV/infra/proxy/Caddyfile, D-124).
  // Next dev blocks dev assets requested from another hostname unless it is listed here. Extra hostnames
  // can be added with DEV_PUBLIC_HOSTS (comma-separated, hostnames only).
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    ...(process.env.DEV_PUBLIC_HOSTS?.split(",").map((h) => h.trim()).filter(Boolean) ?? []),
  ],
  // The portal API is called same-origin ("/api/v1/portal", portal-client.ts). On the shared public URL the
  // proxy sends /api to the gateway before Next sees it; on plain http://localhost:3000 this rewrite does.
  async rewrites() {
    const gateway = process.env.GATEWAY_URL || "http://localhost:8082";
    return [{ source: "/api/:path*", destination: `${gateway}/api/:path*` }];
  },
};

export default nextConfig;
