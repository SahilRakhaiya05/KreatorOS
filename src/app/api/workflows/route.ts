import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { workflowSchema } from "@/server/api/schemas";

export async function GET() {
  // TODO: list persisted automation_rules and recent workflow_runs scoped to the active workspace.
  return apiOk({ workflows: [] });
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, workflowSchema);
  if (isApiResponse(body)) return body;

  // TODO: validate workflow nodes, store an automation_rule, and write an audit log.
  return apiOk({ status: "created", workflow: body }, { status: 201 });
}
