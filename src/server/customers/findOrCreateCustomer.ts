import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function findOrCreateCustomer(input: { workspaceId: string; email: string; name?: string | null }) {
  const supabase = await createSupabaseServerClient();
  const email = input.email.trim().toLowerCase();
  const { data: existing } = await supabase
    .from("customers")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("email", email)
    .maybeSingle();

  if (existing) return { ok: true as const, data: existing };

  const { data, error } = await supabase
    .from("customers")
    .insert({ workspace_id: input.workspaceId, email, name: input.name ?? null })
    .select("*")
    .single();

  if (error) return { ok: false as const, error };
  return { ok: true as const, data };
}
