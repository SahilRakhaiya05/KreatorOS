import { hasSupabaseConfig } from "./config";
import { createSupabaseServerClient } from "./serverClient";

export async function getCurrentUserClaims() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    return null;
  }

  return data?.claims ?? null;
}
