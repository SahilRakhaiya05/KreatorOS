import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { campaignSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, campaignSchema);
  if (isApiResponse(body)) return body;

  return apiOk({ status: "campaign_drafted", recommendedCreators: ["aarav", "maya", "dev"], body });
}
