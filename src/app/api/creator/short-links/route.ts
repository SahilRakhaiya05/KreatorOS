import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { z } from "zod";

export const runtime = "nodejs";

const shortLinkSchema = z.object({
  slug: z.string().min(2, "Slug must be at least 2 characters.").regex(/^[a-zA-Z0-9-_]+$/, "Slug can only contain alphanumeric characters, hyphens, and underscores."),
  destinationUrl: z.string().url("Please enter a valid destination URL."),
  campaignName: z.string().optional().nullable(),
});

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view short links.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("short_links")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) return apiError("links_fetch_failed", error.message, 400);
  return apiOk({ links: data ?? [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to manage short links.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  let body;
  try {
    body = shortLinkSchema.parse(await req.json());
  } catch (err: any) {
    return apiError("validation_error", err.message || "Invalid payload.", 422);
  }

  const supabase = await createSupabaseServerClient();

  // Check if slug already exists
  const { data: existing } = await supabase
    .from("short_links")
    .select("id")
    .eq("slug", body.slug)
    .maybeSingle();

  if (existing) {
    return apiError("slug_exists", "This short link slug is already taken. Please try another.", 400);
  }

  const { data: created, error: insertError } = await supabase
    .from("short_links")
    .insert({
      workspace_id: workspace.id,
      slug: body.slug,
      destination_url: body.destinationUrl,
      campaign_name: body.campaignName || null,
      is_active: true,
      click_count: 0
    })
    .select("*")
    .single();

  if (insertError) return apiError("link_create_failed", insertError.message, 400);

  // Audit log
  await supabase.from("audit_logs").insert({
    workspace_id: workspace.id,
    actor_type: "creator",
    actor_id: user.id,
    action: "shortlink.create",
    payload: { link_id: created.id, slug: created.slug }
  });

  return apiOk({ link: created }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to delete short links.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("missing_id", "Short link ID parameter is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("short_links")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace.id);

  if (error) return apiError("link_delete_failed", error.message, 400);
  return apiOk({ deleted: true, id });
}
