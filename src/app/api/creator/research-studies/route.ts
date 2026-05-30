import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export const runtime = "nodejs";

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view research studies.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();

  const { data: studies, error } = await supabase
    .from("research_studies")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) return apiError("studies_fetch_failed", error.message, 400);

  // Seed default studies if database is empty for this workspace
  if (studies && studies.length === 0) {
    const defaultStudies = [
      {
        workspace_id: workspace.id,
        owner_id: user.id,
        title: "Why visitors do not book calls",
        status: "Running",
        language: "EN + Hindi",
        goal: "People want a lower-priced intro offer before $149 audit.",
        script: { participants: 42, completed: 18 }
      },
      {
        workspace_id: workspace.id,
        owner_id: user.id,
        title: "Product bundle demand",
        status: "Draft",
        language: "EN",
        goal: "AI will interview buyers after template purchase.",
        script: { participants: 120, completed: 0 }
      },
      {
        workspace_id: workspace.id,
        owner_id: user.id,
        title: "Brand buyer objections",
        status: "Completed",
        language: "EN",
        goal: "Brands need clearer deliverables and usage rights before paying.",
        script: { participants: 12, completed: 12 }
      }
    ];

    const { data: inserted, error: insertError } = await supabase
      .from("research_studies")
      .insert(defaultStudies)
      .select("*");

    if (insertError) return apiError("studies_seed_failed", insertError.message, 400);
    return apiOk({ studies: inserted });
  }

  return apiOk({ studies: studies ?? [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to manage research studies.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  let body;
  try {
    body = await req.json();
  } catch {
    return apiError("invalid_json", "Invalid JSON payload.", 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("research_studies")
    .insert({
      workspace_id: workspace.id,
      owner_id: user.id,
      title: body.title,
      status: body.status || "Draft",
      language: body.language || "EN",
      goal: body.goal || "",
      script: body.script || { participants: 0, completed: 0 }
    })
    .select("*")
    .single();

  if (error) return apiError("study_create_failed", error.message, 400);
  return apiOk({ study: data });
}
