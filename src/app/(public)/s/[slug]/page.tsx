import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { recordEvent } from "@/server/analytics/recordEvent";
import { emitEvent } from "@/server/events/emitEvent";

export const runtime = "nodejs";

export default async function ShortLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. Resolve shortlink from DB
    const { data: link } = await supabase
      .from("short_links")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (link) {
      // 2. Increment click count asynchronously in background
      await supabase
        .from("short_links")
        .update({ 
          click_count: (link.click_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", link.id);

      // 3. Log analytics and emit event spine notifications
      try {
        await recordEvent({
          workspaceId: link.workspace_id,
          eventType: "shortlink.clicked",
          metadata: { 
            linkId: link.id, 
            slug: link.slug, 
            destination: link.destination_url 
          },
        });

        await emitEvent({
          type: "shortlink.clicked",
          workspaceId: link.workspace_id,
          actorType: "visitor",
          payload: { 
            linkId: link.id, 
            slug: link.slug, 
            destination: link.destination_url 
          },
          idempotencyKey: `shortlink_click:${link.id}:${Date.now()}`
        });
      } catch {
        // Safe fallback for analytics issues
      }

      // 4. Redirect browser to destination url
      redirect(link.destination_url);
    }
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT") {
      throw err; // Re-throw Next.js redirect exceptions
    }
  }

  // Fallback to default user page if slug is not matched in shortlinks
  redirect(`/u/${slug}`);
}
