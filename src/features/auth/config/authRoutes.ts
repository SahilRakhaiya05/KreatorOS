export const authRoutes = {
  login: "/login",
  callback: "/auth/callback",
  error: "/auth/error",
  onboarding: "/onboarding",
  profileSettings: "/profile/settings",
  afterLogin: "/creator",
} as const;

export const protectedRoutePrefixes = ["/creator", "/brand", "/portal", "/profile"] as const;

export function isProtectedPath(pathname: string) {
  return protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
