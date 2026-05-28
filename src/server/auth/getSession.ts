import { hasSupabaseConfig } from "@/server/supabase/config";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function getSession() {
  if (!hasSupabaseConfig()) {
    return { user: null, claims: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return { user: null, claims: data?.claims ?? null };
  }

  return {
    user: { id: userId, email: typeof data.claims.email === "string" ? data.claims.email : undefined },
    claims: data.claims,
  };
}
