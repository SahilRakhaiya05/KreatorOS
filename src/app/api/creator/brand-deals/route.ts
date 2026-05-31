import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { z } from "zod";

export const runtime = "nodejs";

const brandDealCreateSchema = z.object({
  id: z.string().uuid().optional(),
  action: z.enum(["save", "apply"]).default("save"),
  sourceProgramId: z.string().uuid().optional(),
  brandName: z.string().min(2, "Brand name must be at least 2 characters."),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email("Please enter a valid email.").or(z.literal("")).optional().nullable(),
  status: z.enum(['lead','pitched','replied','negotiating','approved','delivered','paid','lost']),
  rateCents: z.number().nonnegative("Rate must be non-negative."),
  currency: z.string().default("usd"),
  deliverables: z.array(z.string()).default([]),
  dueDate: z.string().optional().nullable(),
  campaignShortLinkId: z.string().uuid().optional().nullable(),
  campaign_short_link_id: z.string().uuid().optional().nullable(),
  application: z.object({
    pitch: z.string().max(2000).optional().default(""),
    audienceFit: z.string().max(500).optional().default(""),
    mediaKitUrl: z.string().max(500).optional().default(""),
    proposedRate: z.string().max(120).optional().default(""),
    timeline: z.string().max(240).optional().default(""),
  }).optional(),
  metadata: z.any().optional(),
  workspaceId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view brand deals.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const { searchParams } = new URL(req.url);
  const marketplace = searchParams.get("marketplace") === "1";
  const supabase = await createSupabaseServerClient();

  if (marketplace) {
    const serviceClient = createSupabaseServiceClient();
    const { data, error } = await serviceClient
      .from("brand_deals")
      .select("*, workspaces(name, slug)")
      .eq("metadata->>public_program", "true")
      .not("workspace_id", "eq", workspace.id)
      .order("created_at", { ascending: false });

    if (error) return apiError("marketplace_fetch_failed", error.message, 400);
    return apiOk({ programs: data ?? [] });
  }
  
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

  if (body.action === "apply") {
    if (!body.sourceProgramId) return apiError("missing_program", "sourceProgramId is required.", 400);

    const serviceClient = createSupabaseServiceClient();
    const { data: program, error: programError } = await serviceClient
      .from("brand_deals")
      .select("*, workspaces(owner_id)")
      .eq("id", body.sourceProgramId)
      .eq("metadata->>public_program", "true")
      .maybeSingle();

    if (programError) return apiError("program_lookup_failed", programError.message, 400);
    if (!program) return apiError("program_not_found", "This brand program is not available.", 404);

    const brandOwnerId = (program.workspaces as any)?.owner_id;
    if (brandOwnerId) {
      await serviceClient.from("workspace_members").upsert(
        {
          workspace_id: workspace.id,
          user_id: brandOwnerId,
          role: "member",
        },
        { onConflict: "workspace_id,user_id" }
      );
    }

    const metadata = {
      ...(program.metadata || {}),
      public_program: false,
      source_program_id: program.id,
      brand_workspace_id: program.workspace_id,
      applied_by_workspace_id: workspace.id,
      application: body.application || {},
      application_status: "submitted",
      applied_at: new Date().toISOString(),
    };

    const { data: created, error: insertError } = await supabase
      .from("brand_deals")
      .insert({
        workspace_id: workspace.id,
        brand_name: program.brand_name,
        contact_name: program.contact_name || null,
        contact_email: program.contact_email || null,
        status: "replied",
        rate_cents: program.rate_cents || 0,
        currency: program.currency || "usd",
        deliverables: program.deliverables || [],
        due_date: program.due_date || null,
        metadata,
      })
      .select("*")
      .single();

    if (insertError) return apiError("application_create_failed", insertError.message, 400);

    const applicationLines = [
      body.application?.pitch ? `Fit: ${body.application.pitch}` : null,
      body.application?.audienceFit ? `Audience: ${body.application.audienceFit}` : null,
      body.application?.mediaKitUrl ? `Proof: ${body.application.mediaKitUrl}` : null,
      body.application?.proposedRate ? `Rate: ${body.application.proposedRate}` : null,
      body.application?.timeline ? `Timeline: ${body.application.timeline}` : null,
    ].filter(Boolean);

    await serviceClient.from("collab_messages").insert({
      campaign_id: created.id,
      sender_user_id: user.id,
      sender_type: "creator",
      body: [`Applied to ${program.brand_name}.`, ...applicationLines].join("\n"),
      metadata: { chat_mode: "human", source_program_id: program.id, application: body.application || {} },
    });

    return apiOk({ deal: created }, { status: 201 });
  }

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
        campaign_short_link_id: body.campaignShortLinkId || body.campaign_short_link_id || null,
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
