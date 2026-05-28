import { apiError } from "@/server/api/responses";

export const runtime = "nodejs";

export async function POST() {
  return apiError("unavailable", "This connector isn't available yet.", 400);
}
