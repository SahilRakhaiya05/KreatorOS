export type WorkspaceRole = "creator" | "brand" | "portal" | "admin";

export type AuthProvider = "supabase" | "clerk" | "demo";

export type AuthSessionState = {
  provider: AuthProvider;
  userId?: string;
  email?: string;
  roles: WorkspaceRole[];
};
