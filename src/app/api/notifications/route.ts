import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view notifications.", 401);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return apiError("notification_list_failed", error.message, 400);

  return apiOk({ notifications: data ?? [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to manage notifications.", 401);

  let body: { notificationId?: string; all?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return apiError("invalid_request_body", "Request body is invalid.", 400);
  }

  const { notificationId, all } = body;
  const supabase = await createSupabaseServerClient();

  if (all) {
    // Fetch all notifications for this owner
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, metadata")
      .eq("owner_id", user.id);

    if (error) return apiError("notification_update_failed", error.message, 400);

    const now = new Date().toISOString();
    const toUpdate = (notifications ?? []).filter(
      (n) => !n.metadata || !(n.metadata as Record<string, any>).read_at
    );

    // Update each unread notification
    for (const item of toUpdate) {
      const metadata = {
        ...(item.metadata as Record<string, any> || {}),
        read_at: now,
      };
      await supabase
        .from("notifications")
        .update({ metadata })
        .eq("id", item.id);
    }

    return apiOk({ success: true, count: toUpdate.length });
  }

  if (notificationId) {
    const { data: item, error } = await supabase
      .from("notifications")
      .select("id, metadata")
      .eq("id", notificationId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) return apiError("notification_fetch_failed", error.message, 400);
    if (!item) return apiError("notification_not_found", "Notification not found.", 404);

    const metadata = {
      ...(item.metadata as Record<string, any> || {}),
      read_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ metadata })
      .eq("id", notificationId);

    if (updateError) return apiError("notification_update_failed", updateError.message, 400);

    return apiOk({ success: true });
  }

  return apiError("invalid_params", "Provide either notificationId or all=true.", 400);
}
