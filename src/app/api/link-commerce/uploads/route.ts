import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";

const allowedBuckets = new Set(["public-assets", "page-assets", "gallery", "product-files"]);

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to upload files.", 401);

  const formData = await req.formData();
  const file = formData.get("file");
  const bucket = String(formData.get("bucket") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!(file instanceof File)) return apiError("missing_file", "Upload requires a file.", 400);
  if (!allowedBuckets.has(bucket)) return apiError("invalid_bucket", "Upload bucket is not allowed.", 400);
  if (!workspaceId) return apiError("missing_workspace", "workspaceId is required.", 400);

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeName = `${workspaceId}/${crypto.randomUUID()}.${extension}`;
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.storage.from(bucket).upload(safeName, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) return apiError("upload_failed", error.message, 400);

  if (bucket === "product-files") {
    return apiOk({ bucket, path: safeName, isPrivate: true });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(safeName);
  return apiOk({ bucket, path: safeName, publicUrl: data.publicUrl, isPrivate: false });
}
