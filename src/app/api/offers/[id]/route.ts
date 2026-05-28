import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { offerUpdateSchema } from "@/server/api/schemas";
import { getSession } from "@/server/auth/getSession";
import { publishOffer } from "@/server/offers/publishOffer";
import { updateOffer } from "@/server/offers/updateOffer";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await parseJsonBody(req, offerUpdateSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to update offers.", 401);

  const result = await updateOffer({ workspaceId: body.workspaceId, offerId: id, actorId: user.id, update: body.update, approved: body.approved });
  if (!result.ok) return apiError("offer_update_failed", "Could not update offer.", 400, result);
  return apiOk({ offer: result.data });
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await parseJsonBody(req, offerUpdateSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to publish offers.", 401);

  const result = await publishOffer({ workspaceId: body.workspaceId, offerId: id, actorId: user.id, approved: body.approved });
  if (!result.ok) return apiError("approval_required", "Publishing this offer needs approval.", 409, result);
  return apiOk({ offer: result.data });
}
