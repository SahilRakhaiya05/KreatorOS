import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { z } from "zod";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const runtime = "nodejs";

const messageCreateSchema = z.object({
  campaignId: z.string().uuid(),
  body: z.string().min(1, "Message cannot be empty."),
  senderType: z.enum(["creator", "brand", "system"]).default("creator"),
  chatMode: z.enum(["ai", "human"]).default("ai"),
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

  let body;
  try {
    body = messageCreateSchema.parse(await req.json());
  } catch (err: any) {
    return apiError("validation_error", err.message || "Invalid payload.", 422);
  }

  const supabase = await createSupabaseServerClient();

  // 1. Insert sender's message
  const { data: createdMsg, error: insertError } = await supabase
    .from("collab_messages")
    .insert({
      campaign_id: body.campaignId,
      sender_user_id: user.id,
      sender_type: body.senderType,
      body: body.body,
      metadata: { chat_mode: body.chatMode }
    })
    .select("*")
    .single();

  if (insertError) return apiError("message_send_failed", insertError.message, 400);

  // If chatMode is human, we do not auto-generate AI responses
  if (body.chatMode !== "ai") {
    return apiOk({ message: createdMsg, brandReply: null, creatorReply: null }, { status: 201 });
  }

  // 2. Fetch campaign and deal details for rich context
  const { data: deal } = await supabase
    .from("brand_deals")
    .select("*")
    .eq("id", body.campaignId)
    .maybeSingle();

  if (!deal) {
    return apiOk({ message: createdMsg, reply: null });
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("workspace_id", deal.workspace_id)
    .maybeSingle();

  // Fetch recent chat history
  const { data: previousMessages } = await supabase
    .from("collab_messages")
    .select("body, sender_type, metadata")
    .eq("campaign_id", body.campaignId)
    .order("created_at", { ascending: false })
    .limit(8);

  const historyText = (previousMessages || [])
    .reverse()
    .map((m) => `${m.sender_type === "creator" ? "Creator" : "Brand"}: ${m.body}`)
    .join("\n");

  const brandName = deal.brand_name || "Brand Partner";
  const budget = deal.rate_cents ? `$${(deal.rate_cents / 100).toFixed(2)}` : "TBD";
  const deliverablesBrief = deal.deliverables ? `Deliverables: ${deal.deliverables.join(", ")}` : "TBD";

  // CASE A: Brand sent a message -> Creator's custom AI Sponsor Chatbot responds!
  if (body.senderType === "brand") {
    const theme = creatorProfile?.theme || {};
    const brandBot = theme.brand_bot || {
      welcomeMessage: "Hey! Let's collaborate. Tell me about your brand and what campaign you have in mind!",
      systemPrompt: "You are a brand sponsorships chatbot for this creator. Provide information about audience niche focus, standard deliverables, and direct sponsor inquiries politely. Suggest that they switch to the Human Rep tab if they wish to discuss specific terms.",
      tone: "professional, welcoming, collaborative",
      enabled: true,
    };

    if (!brandBot.enabled) {
      return apiOk({ message: createdMsg, reply: null }, { status: 201 });
    }

    const systemPrompt = `You are the AI Brand Partnerships Chatbot representing the creator "${creatorProfile?.display_name || "Demo Creator"}".
Here are the creator's details:
- Username: @${creatorProfile?.username || "demo"}
- Niche: ${creatorProfile?.niche || "B2B SaaS and AI content"}
- Audience: ${creatorProfile?.audience || "developers, founders, tech professionals"}
- Audience Promise: ${creatorProfile?.promise || "Helping brands connect with top technical minds"}

You are talking to a representative from the brand "${brandName}".
- Current Deal Rate: ${budget}
- Deliverables: ${deliverablesBrief}

Your tone & personality: ${brandBot.tone}
Your guidelines: ${brandBot.systemPrompt}

Respond to the brand's latest message naturally in character as the creator's AI Sponsor Manager.
If they are ready to finalize contract details or need specific manual approvals, politely instruct them to toggle the switch at the top to the "Human Rep" tab so the creator can jump in and finalize.
Keep your response extremely concise: exactly 2-3 sentences. No markdown headers, JSON blocks, or placeholders.`;

    let replyBody = "";
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        const { text } = await generateText({
          model: google("gemini-2.0-flash"),
          system: systemPrompt,
          prompt: `Here is the conversation history:\n${historyText}\n\nCreator's AI Sponsor Chatbot Reply:`,
          temperature: 0.5,
        });
        replyBody = text.trim();
      } catch (e) {
        console.error("Gemini creator AI reply failed:", e);
      }
    }

    if (!replyBody) {
      replyBody = `Hey! Thanks for reaching out to collaborate. Let me check my schedule for ${deliverablesBrief}. If you'd like to finalize right away, please toggle to the 'Human Rep' tab so I can jump in directly!`;
    }

    // Insert Creator AI Response
    const { data: creatorReply } = await supabase
      .from("collab_messages")
      .insert({
        campaign_id: body.campaignId,
        sender_type: "creator",
        body: replyBody,
        metadata: { chat_mode: "ai", is_ai: true }
      })
      .select("*")
      .single();

    return apiOk({ message: createdMsg, creatorReply }, { status: 201 });
  }

  // CASE B: Creator sent a message -> Brand's Onboarding AI responds!
  if (body.senderType === "creator") {
    // Automated AI Onboarding Prerequisite Extraction Pass
    let currentMeta = deal.metadata || {};
    if (typeof currentMeta !== "object" || currentMeta === null) {
      currentMeta = {};
    }
    
    let prereqs = currentMeta.prerequisites || {
      media_kit: null,
      rate: null,
      audience: null,
      delivery_date: null,
      status: {
        media_kit: "pending",
        rate: "pending",
        audience: "pending",
        delivery_date: "pending"
      }
    };

    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        const extractionPrompt = `You are a professional AI campaign assistant designed to scan the creator's latest message and extract sponsorship prerequisites.
        Scanning for:
        1. media_kit: portfolio/media kit URL (e.g. https://... or portfolio.me)
        2. rate: price/fee in USD (e.g. $1000, 500 dollars)
        3. audience: target demographics/niche focus (e.g. B2B, tech founders, students)
        4. delivery_date: preferred delivery date/deadline (e.g. "June 25", "next Friday")

        Creator's Message: "${body.body}"

        Extract these fields and output a JSON block matching the keys below. If a field is not found, set its value to null.
        Output pure JSON only.

        {
          "media_kit": string or null,
          "rate": string or null,
          "audience": string or null,
          "delivery_date": string or null
        }`;

        const { text: extractionText } = await generateText({
          model: google("gemini-2.0-flash"),
          prompt: extractionPrompt,
          temperature: 0.1,
        });

        const cleanJson = extractionText.replace(/```json/g, "").replace(/```/g, "").trim();
        const extracted = JSON.parse(cleanJson);

        if (extracted && typeof extracted === "object") {
          let updated = false;
          if (extracted.media_kit) {
            prereqs.media_kit = extracted.media_kit;
            prereqs.status.media_kit = "submitted";
            updated = true;
          }
          if (extracted.rate) {
            prereqs.rate = extracted.rate;
            prereqs.status.rate = "submitted";
            updated = true;
          }
          if (extracted.audience) {
            prereqs.audience = extracted.audience;
            prereqs.status.audience = "submitted";
            updated = true;
          }
          if (extracted.delivery_date) {
            prereqs.delivery_date = extracted.delivery_date;
            prereqs.status.delivery_date = "submitted";
            updated = true;
          }

          if (updated) {
            currentMeta.prerequisites = prereqs;
            await supabase
              .from("brand_deals")
              .update({ metadata: currentMeta })
              .eq("id", body.campaignId);
          }
        }
      } catch (e) {
        console.error("AI Prerequisite Extraction failed:", e);
      }
    }

    const missingPrereqsList = [];
    if (prereqs.status.media_kit === "pending") missingPrereqsList.push("Media Kit URL");
    if (prereqs.status.rate === "pending") missingPrereqsList.push("Expected rate");
    if (prereqs.status.audience === "pending") missingPrereqsList.push("Target audience niche");
    if (prereqs.status.delivery_date === "pending") missingPrereqsList.push("Preferred deadline");

    const statusContext = `Checklist Status:
- Media Kit: ${prereqs.status.media_kit} (${prereqs.media_kit || "None"})
- Expected Rate: ${prereqs.status.rate} (${prereqs.rate || "None"})
- Target Audience: ${prereqs.status.audience} (${prereqs.audience || "None"})
- Delivery Deadline: ${prereqs.status.delivery_date} (${prereqs.delivery_date || "None"})`;

    const systemPrompt = `You are a professional brand manager and sponsorships onboarding AI assistant representing the brand "${brandName}" in a direct workspace collaboration chat with a creator.
The campaign budget is ${budget}. Deliverables list: ${deliverablesBrief}.

Your primary goal is to collect four key prerequisites from the creator before passing them to the human brand manager:
1. Media Kit URL
2. Expected sponsorship rate
3. Target audience focus
4. Delivery timeline/date

Here is the checklist status of these prerequisites:
${statusContext}

Current Missing: ${missingPrereqsList.length > 0 ? missingPrereqsList.join(", ") : "None! All parameters collected."}

Tone: supportive, welcoming, business-professional.
Rules:
- Respond in character as the Brand's Onboarding AI.
- Acknowledge any details the creator just provided.
- Ask for any remaining missing parameters clearly.
- If all prerequisites are fully submitted, congratulate them and let them know the human representative will review the details in the 'Human Rep' tab shortly!
- Keep response extremely concise: exactly 2-3 sentences. No markdown headers, JSON blocks, or placeholders.`;

    let replyBody = "";
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        const { text } = await generateText({
          model: google("gemini-2.0-flash"),
          system: systemPrompt,
          prompt: `Here is the conversation history:\n${historyText}\n\nBrand Representative Reply:`,
          temperature: 0.4,
        });
        replyBody = text.trim();
      } catch (e) {
        console.error("Gemini brand message generation failed:", e);
      }
    }

    if (!replyBody) {
      if (missingPrereqsList.length > 0) {
        replyBody = `Thanks for the details! To finish setting up our campaign brief, could you please provide your ${missingPrereqsList.slice(0, 2).join(" and ")}? That will help us finalize approval.`;
      } else {
        replyBody = `Brilliant! I have successfully checked off all onboarding prerequisites. I've sent the details to our sponsorships lead. You can coordinate directly in the Human Representative tab!`;
      }
    }

    // Insert Brand AI Response
    const { data: brandReply } = await supabase
      .from("collab_messages")
      .insert({
        campaign_id: body.campaignId,
        sender_type: "brand",
        body: replyBody,
        metadata: { chat_mode: "ai", is_ai: true }
      })
      .select("*")
      .single();

    return apiOk({ message: createdMsg, brandReply }, { status: 201 });
  }

  return apiOk({ message: createdMsg, reply: null });
}
