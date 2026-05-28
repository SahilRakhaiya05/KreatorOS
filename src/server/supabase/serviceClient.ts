import { createClient } from "@supabase/supabase-js";

import { assertServerOnly } from "@/server/security/assertServerOnly";
import { getSupabaseServiceConfig } from "./config";

export function createSupabaseServiceClient() {
  assertServerOnly("createSupabaseServiceClient");
  const { url, serviceRoleKey } = getSupabaseServiceConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
