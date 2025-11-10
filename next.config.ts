import type { NextConfig } from "next";

const backend = process.env.BACKEND_INTERNAL_URL || "http://backend:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${backend}/api/auth/:path*` },
      { source: "/api/users/:path*", destination: `${backend}/api/users/:path*` },
      { source: "/api/orders/:path*", destination: `${backend}/api/orders/:path*` },
      { source: "/api/bots/:path*", destination: `${backend}/api/bots/:path*` },
      { source: "/api/analytics/:path*", destination: `${backend}/api/analytics/:path*` },
      { source: "/api/monitoring/:path*", destination: `${backend}/api/monitoring/:path*` },
      { source: "/api/customers/:path*", destination: `${backend}/api/customers/:path*` },
      { source: "/api/catalog/:path*", destination: `${backend}/api/catalog/:path*` },
      { source: "/api/pricing/:path*", destination: `${backend}/api/pricing/:path*` },
      { source: "/api/payments/:path*", destination: `${backend}/api/payments/:path*` },
      { source: "/api/payment-methods/:path*", destination: `${backend}/api/payment-methods/:path*` },
      { source: "/api/kpis/:path*", destination: `${backend}/api/kpis/:path*` },
      { source: "/api/config/:path*", destination: `${backend}/api/config/:path*` },
      { source: "/api/logs/:path*", destination: `${backend}/api/logs/:path*` },
      { source: "/api/health", destination: `${backend}/api/health` },
    ];
  },
};

export default nextConfig;
