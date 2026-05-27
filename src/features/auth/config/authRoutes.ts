export const authRoutes = {
  login: "/login",
  callback: "/auth/callback",
  error: "/auth/error",
  afterLogin: "/creator",
} as const;

export const protectedRoutePrefixes = ["/creator", "/brand", "/portal"] as const;

export function isProtectedPath(pathname: string) {
  return protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
