"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "../../server/supabase/config";

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseConfig();

  return createBrowserClient(url, publishableKey);
}
