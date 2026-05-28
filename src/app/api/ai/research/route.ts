import { apiOk } from "@/server/api/responses";

export async function POST() {
  return apiOk({
    status: "draft_ready",
    message: "Research jobs are queued through the approved research provider layer before they can affect page or offer data.",
  });
}
