import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { workflowSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list workflows.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) {
    return apiError("missing_workspace", "No active workspace found.", 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) return apiError("workflow_list_failed", error.message, 400);
  return apiOk({ workflows: data ?? [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create/update workflows.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) {
    return apiError("missing_workspace", "No active workspace found.", 400);
  }

  const body = await parseJsonBody(req, workflowSchema);
  if (isApiResponse(body)) return body;

  const supabase = await createSupabaseServerClient();

  // If ID is provided, perform an update
  if (body.id) {
    const { data: existing, error: findError } = await supabase
      .from("workflows")
      .select("id, version")
      .eq("id", body.id)
      .eq("workspace_id", workspace.id)
      .maybeSingle();

    if (findError) return apiError("workflow_query_failed", findError.message, 400);
    if (!existing) return apiError("workflow_not_found", "Workflow not found or not owned by workspace.", 404);

    const nextVersion = (existing.version || 1) + 1;

    const { data: updated, error: updateError } = await supabase
      .from("workflows")
      .update({
        name: body.name ?? "Unnamed Workflow",
        trigger_event: body.trigger ?? "page.viewed",
        status: body.status ?? "draft",
        graph: {
          nodes: body.nodes ?? [],
          edges: body.edges ?? []
        },
        version: nextVersion
      })
      .eq("id", body.id)
      .select("*")
      .single();

    if (updateError) return apiError("workflow_update_failed", updateError.message, 400);

    // Audit log
    await supabase.from("audit_logs").insert({
      workspace_id: workspace.id,
      actor_type: "creator",
      actor_id: user.id,
      action: "workflow.update",
      payload: { workflow_id: updated.id, name: updated.name, version: updated.version }
    });

    return apiOk({ status: "updated", workflow: updated });
  } else {
    // Perform an insert
    const { data: created, error: insertError } = await supabase
      .from("workflows")
      .insert({
        workspace_id: workspace.id,
        name: body.name ?? "Unnamed Workflow",
        trigger_event: body.trigger ?? "page.viewed",
        status: body.status ?? "draft",
        graph: {
          nodes: body.nodes ?? [],
          edges: body.edges ?? []
        },
        version: 1
      })
      .select("*")
      .single();

    if (insertError) return apiError("workflow_insert_failed", insertError.message, 400);

    // Audit log
    await supabase.from("audit_logs").insert({
      workspace_id: workspace.id,
      actor_type: "creator",
      actor_id: user.id,
      action: "workflow.create",
      payload: { workflow_id: created.id, name: created.name }
    });

    return apiOk({ status: "created", workflow: created }, { status: 201 });
  }
}

export async function DELETE(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to delete workflows.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return apiError("missing_id", "Workflow ID parameter is required.", 400);

  const supabase = await createSupabaseServerClient();

  // Find workflow first for audit payload
  const { data: existing } = await supabase
    .from("workflows")
    .select("id, name")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (!existing) {
    return apiError("workflow_not_found", "Workflow not found or not owned by workspace.", 404);
  }

  const { error: deleteError } = await supabase
    .from("workflows")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace.id);

  if (deleteError) return apiError("workflow_delete_failed", deleteError.message, 400);

  // Audit log
  await supabase.from("audit_logs").insert({
    workspace_id: workspace.id,
    actor_type: "creator",
    actor_id: user.id,
    action: "workflow.delete",
    payload: { workflow_id: id, name: existing.name }
  });

  return apiOk({ status: "deleted", id });
}
