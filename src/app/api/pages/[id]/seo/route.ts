import { z } from "zod";

import { apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";

const seoSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(180),
});

export async function POST(req: Request) {
  const body = await parseJsonBody(req, seoSchema);
  if (isApiResponse(body)) return body;

  return apiOk({ status: "accepted", seo: body });
}
