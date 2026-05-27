export type WorkspaceRole = "creator" | "brand" | "portal" | "admin";

export type AccountType = "user" | "creator" | "business" | "admin";

export type AuthProvider = "supabase" | "clerk" | "demo";

export type AuthSessionState = {
  provider: AuthProvider;
  userId?: string;
  email?: string;
  roles: WorkspaceRole[];
};

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  account_type: AccountType | null;
  onboarding_completed: boolean;
  preferences: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
};
