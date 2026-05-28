import { apiError } from "@/server/api/responses";

export const runtime = "nodejs";

export async function POST() {
  // TODO: start provider-specific OAuth/API-key connection flow and persist provider_connections state.
  return apiError("unavailable", "This connector isn't available yet.", 400);
}
