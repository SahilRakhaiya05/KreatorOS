import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { z } from "zod";

export const runtime = "nodejs";

const brandDealCreateSchema = z.object({
  id: z.string().uuid().optional(),
  brandName: z.string().min(2, "Brand name must be at least 2 characters."),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email("Please enter a valid email.").or(z.literal("")).optional().nullable(),
  status: z.enum(['lead','pitched','replied','negotiating','approved','delivered','paid','lost']),
  rateCents: z.number().nonnegative("Rate must be non-negative."),
  currency: z.string().default("usd"),
  deliverables: z.array(z.string()).default([]),
  dueDate: z.string().optional().nullable(),
  metadata: z.any().optional(),
  workspaceId: z.string().uuid().optional(),
});

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view brand deals.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  
  let query = supabase.from("brand_deals").select("*, campaign_short_link_id(*)");
  
  if (workspace.type === "brand") {
    // Brand user wants to see all deals in workspaces where they are a member
    const { data: memberWorkspaces } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);
      
    const workspaceIds = memberWorkspaces?.map(mw => mw.workspace_id) || [];
    if (workspaceIds.length === 0) {
      return apiOk({ deals: [] });
    }
    query = query.in("workspace_id", workspaceIds);
  } else {
    // Creator user wants to see only deals in their own workspace
    query = query.eq("workspace_id", workspace.id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return apiError("deals_fetch_failed", error.message, 400);
  return apiOk({ deals: data ?? [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to manage brand deals.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  let body;
  try {
    body = brandDealCreateSchema.parse(await req.json());
  } catch (err: any) {
    return apiError("validation_error", err.message || "Invalid payload.", 422);
  }

  const supabase = await createSupabaseServerClient();

  if (body.id) {
    // Perform update
    const { data: updated, error: updateError } = await supabase
      .from("brand_deals")
      .update({
        brand_name: body.brandName,
        contact_name: body.contactName,
        contact_email: body.contactEmail || null,
        status: body.status,
        rate_cents: body.rateCents,
        currency: body.currency,
        deliverables: body.deliverables,
        due_date: body.dueDate || null,
        metadata: body.metadata || undefined,
        updated_at: new Date().toISOString()
      })
      .eq("id", body.id)
      .select("*")
      .single();

    if (updateError) return apiError("deal_update_failed", updateError.message, 400);
    return apiOk({ deal: updated });
  } else {
    // Perform insert
    const targetWorkspaceId = body.workspaceId || workspace.id;

    if (body.workspaceId) {
      // Use service client to bypass RLS and add the user to workspace_members of the creator workspace
      const serviceClient = createSupabaseServiceClient();
      try {
        await serviceClient
          .from("workspace_members")
          .upsert({
            workspace_id: body.workspaceId,
            user_id: user.id,
            role: "member"
          }, { onConflict: "workspace_id,user_id" });
      } catch (e) {
        console.error("Auto-joining workspace failed:", e);
      }
    }

    const { data: created, error: insertError } = await supabase
      .from("brand_deals")
      .insert({
        workspace_id: targetWorkspaceId,
        brand_name: body.brandName,
        contact_name: body.contactName || null,
        contact_email: body.contactEmail || null,
        status: body.status,
        rate_cents: body.rateCents,
        currency: body.currency,
        deliverables: body.deliverables,
        due_date: body.dueDate || null,
        metadata: body.metadata || {},
      })
      .select("*")
      .single();

    if (insertError) return apiError("deal_create_failed", insertError.message, 400);
    return apiOk({ deal: created }, { status: 201 });
  }
}

export async function DELETE(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to delete brand deals.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiError("missing_id", "Deal ID parameter is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("brand_deals")
    .delete()
    .eq("id", id);

  if (error) return apiError("deal_delete_failed", error.message, 400);
  return apiOk({ deleted: true, id });
}
