import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { workflowSchema } from "@/server/api/schemas";

export async function GET() {
  return apiOk({ workflows: [] });
}

export async function POST(req: Request) {
  const body = await parseJsonBody(req, workflowSchema);
  if (isApiResponse(body)) return body;

  return apiOk({ status: "created", workflow: body }, { status: 201 });
}
