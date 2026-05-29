import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { z } from "zod";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

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

  // 2. Fetch campaign details and chat history for rich AI brand context
  const { data: campaign } = await supabase
    .from("brand_campaigns")
    .select("*")
    .eq("id", body.campaignId)
    .maybeSingle();

  const { data: previousMessages } = await supabase
    .from("collab_messages")
    .select("body, sender_type")
    .eq("campaign_id", body.campaignId)
    .order("created_at", { ascending: false })
    .limit(8);

  const brandName = campaign?.title || "Brand Representative";
  const budget = campaign?.budget_cents ? `$${(campaign.budget_cents / 100).toFixed(2)}` : "TBD";
  const brief = campaign?.brief ? JSON.stringify(campaign.brief) : "No campaign briefs submitted yet.";
  
  const historyText = (previousMessages || [])
    .reverse()
    .map((m) => `${m.sender_type === "creator" ? "Creator" : "Brand"}: ${m.body}`)
    .join("\n");

  const systemPrompt = `You are a professional brand manager and sponsorships manager representing the brand "${brandName}" in a direct workspace collaboration chat with a creator.
The campaign budget is ${budget}. The campaign deliverables/brief context is: ${brief}.
Your tone should be highly professional, polite, business-oriented, and realistic. 
Respond to the creator's last message naturally in character as the Brand Representative. Keep your response to 2-3 concise and clear sentences. 
Do not include any placeholders, JSON tags, block tags, or markdown headers. Write purely the text response that the brand manager would reply with.`;

  // 3. Generate dynamic Gemini brand reply
  let brandReplyBody = "";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        system: systemPrompt,
        prompt: `Here is the conversation history:\n${historyText}\n\nBrand Representative Reply:`,
        temperature: 0.7,
      });
      brandReplyBody = text.trim();
    } catch (e) {
      console.error("Gemini brand message generation failed, using rule-based fallback:", e);
    }
  }

  // 4. Fallback to static rule matching if Gemini failed or key not present
  if (!brandReplyBody) {
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
  }

  // 5. Insert Brand response
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
