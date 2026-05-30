import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { z } from "zod";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const runtime = "nodejs";

const researchSchema = z.object({
  creatorId: z.string().uuid(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    })
  ),
});

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to research creators.", 401);

  let body;
  try {
    body = researchSchema.parse(await req.json());
  } catch (err: any) {
    return apiError("validation_error", err.message || "Invalid payload.", 422);
  }

  const supabase = await createSupabaseServerClient();

  // Query creator details
  const { data: creator, error } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("id", body.creatorId)
    .maybeSingle();

  if (error || !creator) {
    return apiError("creator_not_found", "Could not locate this creator profile.", 404);
  }

  const systemPrompt = `You are a professional AI Creator Talent Analyst. You are chatting with a brand sponsorships manager who is researching the creator named "${creator.display_name}" (username: @${creator.username}) to evaluate them for a possible brand partnership campaign.

Here is the creator's real profile data from our network:
- Name: ${creator.display_name}
- Username: @${creator.username}
- Niche: ${creator.niche || "General Content Creator"}
- Audience Focus: ${creator.audience || "General Audience"}
- Main Audience Promise: ${creator.promise || "Delivering high quality content and engagement."}
- Verification Status: Quality-scored Pro Candidate

Your goal is to answer the brand manager's questions in character as our Talent Analyst. Be highly analytical, objective, supportive, and insightful. Offer suggestions on deliverables (e.g. video integrations, post sponsorships), rate alignments, and outline why they would or would not be a strong fit for the brand's campaign.
Keep your response concise and conversational (maximum 3-4 sentences per turn). Do not use markdown headers, blockquotes, or JSON tags. Speak directly to the brand manager.`;

  let replyText = "";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const { text } = await generateText({
        model: google("gemini-2.0-flash"),
        system: systemPrompt,
        messages: body.messages,
        temperature: 0.7,
      });
      replyText = text.trim();
    } catch (e) {
      console.error("Gemini creator research failed:", e);
    }
  }

  if (!replyText) {
    // Fallback if API key is not present or failed
    replyText = `Based on our records, @${creator.username} focuses mainly on "${creator.niche}". Their promise is: "${creator.promise}". They are highly recommended for campaigns targeting ${creator.audience}. Let me know if you would like me to draft some deliverable suggestions!`;
  }

  return apiOk({ reply: replyText });
}
