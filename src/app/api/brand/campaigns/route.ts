import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { campaignSchema } from "@/server/api/schemas";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, campaignSchema);
  if (isApiResponse(body)) return body;

  // TODO: persist campaign brief under the active brand workspace and emit brand.campaign.created.
  return apiOk({ status: "campaign_drafted", recommendedCreators: ["aarav", "maya", "dev"], body });
}
