import { apiError } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";

export const runtime = "nodejs";

export async function POST() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to connect providers.", 401);

  // TODO: start provider-specific OAuth/API-key connection flow and persist provider_connections state.
  return apiError("unavailable", "This connector isn't available yet.", 400);
}
