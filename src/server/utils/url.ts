/**
 * Safely resolves the public origin (protocol + host) of the application
 * from a request, taking into account reverse proxies and site configurations.
 */
export function getRequestOrigin(req: Request): string {
  const url = new URL(req.url);
  
  // 1. Read forwarded host and protocol set by reverse proxies (Nginx, Cloudflare, etc.)
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  // 2. Read NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL environment variables
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (siteUrl && !siteUrl.includes("localhost")) {
    return siteUrl;
  }
  
  // 3. Fallback to standard URL origin
  return url.origin;
}
