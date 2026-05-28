import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { workflowSchema } from "@/server/api/schemas";
import { apiError } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to list workflows.", 401);

  // TODO: list persisted automation_rules and recent workflow_runs scoped to the active workspace.
  return apiOk({ workflows: [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create workflows.", 401);

  const body = await parseJsonBody(req, workflowSchema);
  if (isApiResponse(body)) return body;

  // TODO: validate workflow nodes, store an automation_rule, and write an audit log.
  return apiOk({ status: "created", workflow: body }, { status: 201 });
}
