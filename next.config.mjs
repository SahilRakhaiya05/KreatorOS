import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const posthogRegion = process.env.NEXT_PUBLIC_POSTHOG_HOST?.includes("eu.") ? "eu" : "us";
const posthogApiHost = `https://${posthogRegion}.i.posthog.com`;
const posthogAssetsHost = `https://${posthogRegion}-assets.i.posthog.com`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: __dirname
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "code" }],
        destination: "/auth/callback",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "query", key: "error" }],
        destination: "/auth/error",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "query", key: "error_code" }],
        destination: "/auth/error",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "query", key: "error_description" }],
        destination: "/auth/error",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/k-os-signal/static/:path*",
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: "/k-os-signal/array/:path*",
        destination: `${posthogAssetsHost}/array/:path*`,
      },
      {
        source: "/k-os-signal/:path*",
        destination: `${posthogApiHost}/:path*`,
      },
    ];
  },
};

export default nextConfig;
