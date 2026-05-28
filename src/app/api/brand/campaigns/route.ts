import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { campaignSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to create campaigns.", 401);

  const body = await parseJsonBody(req, campaignSchema);
  if (isApiResponse(body)) return body;

  // TODO: persist campaign brief under the active brand workspace and emit brand.campaign.created.
  return apiOk({ status: "campaign_drafted", recommendedCreators: [], body });
}
