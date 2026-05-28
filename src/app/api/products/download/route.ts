import { apiError, apiOk } from "@/server/api/responses";
import { productService } from "@/server/products/productService";
import { z } from "zod";

export const runtime = "nodejs";

const downloadRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
});

export async function POST(req: Request) {
  let body;
  try {
    body = downloadRequestSchema.parse(await req.json());
  } catch {
    return apiError("invalid_request", "Please provide a valid workspaceId, customerId, and productId.", 400);
  }

  const result = await productService.verifyAndGenerateDownload({
    workspaceId: body.workspaceId,
    customerId: body.customerId,
    productId: body.productId,
  });

  if (!result.ok) {
    return apiError("download_failed", result.error || "Access denied.", 403);
  }

  return apiOk({ downloadUrl: result.downloadUrl });
}
