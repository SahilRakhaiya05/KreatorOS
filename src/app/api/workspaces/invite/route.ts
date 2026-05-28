import { createHash, randomBytes } from "crypto";

import { apiError, apiOk, isApiResponse, parseJsonBody } from "@/server/api/responses";
import { workspaceInviteSchema } from "@/server/api/schemas";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { getSession } from "@/server/auth/getSession";
import { writeAuditLog } from "@/server/audit/writeAuditLog";

export async function POST(req: Request) {
  const body = await parseJsonBody(req, workspaceInviteSchema);
  if (isApiResponse(body)) return body;

  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to invite members.", 401);

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspace_invitations")
    .insert({
      workspace_id: body.workspaceId,
      email: body.email.toLowerCase(),
      role: body.role,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error) return apiError("invite_failed", error.message, 400);

  await writeAuditLog({
    workspaceId: body.workspaceId,
    actorType: "creator",
    actorId: user.id,
    action: "workspace.invitation.created",
    targetType: "workspace_invitation",
    targetId: data.id,
    after: { email: body.email, role: body.role, expiresAt },
  });

  return apiOk({ invitation: data, token }, { status: 201 });
}
