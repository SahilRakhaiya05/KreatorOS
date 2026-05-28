import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { z } from "zod";

export const runtime = "nodejs";

const createAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  scope: z.string().optional(),
  tools: z.array(z.string()).default([]),
  policy: z.record(z.string(), z.unknown()).default({}),
  memory_config: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to manage agents.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  let body;
  try {
    body = createAgentSchema.parse(await req.json());
  } catch {
    return apiError("invalid_request", "Please provide a valid agent configuration.", 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_agents")
    .insert({
      workspace_id: workspace.id,
      name: body.name,
      description: body.description || null,
      scope: body.scope || null,
      tools: body.tools,
      policy: body.policy,
      memory_config: body.memory_config,
    })
    .select("*")
    .single();

  if (error) {
    return apiError("agent_creation_failed", error.message, 400);
  }

  return apiOk({ agent: data });
}

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view agents.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("agents_fetch_failed", error.message, 400);
  }

  return apiOk({ agents: data });
}
