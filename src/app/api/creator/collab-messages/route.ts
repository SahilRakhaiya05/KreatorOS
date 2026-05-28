import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { z } from "zod";

export const runtime = "nodejs";

const messageCreateSchema = z.object({
  campaignId: z.string().uuid(),
  body: z.string().min(1, "Message cannot be empty."),
  senderType: z.enum(["creator", "brand", "system"]).default("creator"),
});

export async function GET(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view messages.", 401);

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");
  if (!campaignId) return apiError("missing_id", "campaignId is required.", 400);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("collab_messages")
    .select("*, profiles(full_name, avatar_url)")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) return apiError("messages_fetch_failed", error.message, 400);
  return apiOk({ messages: data ?? [] });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to send messages.", 401);

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) return apiError("missing_workspace", "No active workspace found.", 400);

  let body;
  try {
    body = messageCreateSchema.parse(await req.json());
  } catch (err: any) {
    return apiError("validation_error", err.message || "Invalid payload.", 422);
  }

  const supabase = await createSupabaseServerClient();

  // 1. Insert creator's message
  const { data: createdMsg, error: insertError } = await supabase
    .from("collab_messages")
    .insert({
      campaign_id: body.campaignId,
      sender_user_id: user.id,
      sender_type: body.senderType,
      body: body.body,
    })
    .select("*")
    .single();

  if (insertError) return apiError("message_send_failed", insertError.message, 400);

  // 2. Generate simulated real-time AI reply from Brand Representative
  let brandReplyBody = "";
  const lowercaseBody = body.body.toLowerCase();
  
  if (lowercaseBody.includes("rate") || lowercaseBody.includes("price") || lowercaseBody.includes("cost") || lowercaseBody.includes("$")) {
    brandReplyBody = "We've reviewed your pricing proposal. While the budget looks slightly higher than our baseline, we can approve this rate if you include 30-day usage rights for our paid acquisition channels. What do you think?";
  } else if (lowercaseBody.includes("deliverable") || lowercaseBody.includes("video") || lowercaseBody.includes("draft")) {
    brandReplyBody = "That deliverable schedule sounds perfect! We typically need 3 business days to review the initial draft. I'll make sure our creative director is ready when you submit the link.";
  } else if (lowercaseBody.includes("contract") || lowercaseBody.includes("agree") || lowercaseBody.includes("proposal")) {
    brandReplyBody = "Excellent! I have forwarded the campaign details to our legal department to draft the formal contract. You should receive the signature request link shortly.";
  } else {
    brandReplyBody = "Thank you for the update! We are excited to collaborate with you on this campaign. Let us know if you need any asset packs or logos from our brand drive.";
  }

  // Insert Brand AI Representative response
  const { data: brandReply } = await supabase
    .from("collab_messages")
    .insert({
      campaign_id: body.campaignId,
      sender_type: "brand",
      body: brandReplyBody,
      metadata: { is_ai: true }
    })
    .select("*")
    .single();

  return apiOk({ 
    message: createdMsg, 
    brandReply: brandReply || null 
  }, { status: 201 });
}
