import { apiError, apiOk } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { z } from "zod";

export const runtime = "nodejs";

const brandBotConfigSchema = z.object({
  welcomeMessage: z.string().min(1, "Welcome message is required."),
  systemPrompt: z.string().min(1, "System prompt is required."),
  tone: z.string().min(1, "Tone is required."),
  enabled: z.boolean().default(true),
});

export async function GET() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to view brand bot configuration.", 401);

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("creator_profiles")
    .select("theme")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) return apiError("profile_fetch_failed", error.message, 400);

  const theme = profile?.theme || {};
  const brandBot = theme.brand_bot || {
    welcomeMessage: "Hey! Let's collaborate. Tell me about your brand and what campaign you have in mind, and I can walk you through our demographics and standard rates!",
    systemPrompt: "You are a brand sponsorships chatbot for this creator. Provide information about audience niche focus, standard deliverables, and direct sponsor inquiries politely. Suggest that they switch to the Human Rep tab if they wish to discuss specific terms.",
    tone: "professional, welcoming, collaborative",
    enabled: true,
  };

  return apiOk({ brandBot });
}

export async function POST(req: Request) {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to save configuration.", 401);

  let body;
  try {
    body = brandBotConfigSchema.parse(await req.json());
  } catch (err: any) {
    return apiError("validation_error", err.message || "Invalid payload.", 422);
  }

  const supabase = await createSupabaseServerClient();

  // Fetch current theme
  const { data: profile, error: fetchError } = await supabase
    .from("creator_profiles")
    .select("theme")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (fetchError) return apiError("profile_fetch_failed", fetchError.message, 400);

  const currentTheme = profile?.theme || {};
  currentTheme.brand_bot = {
    welcomeMessage: body.welcomeMessage,
    systemPrompt: body.systemPrompt,
    tone: body.tone,
    enabled: body.enabled,
  };

  const { data: updatedProfile, error: updateError } = await supabase
    .from("creator_profiles")
    .update({ theme: currentTheme })
    .eq("owner_id", user.id)
    .select("theme")
    .single();

  if (updateError) return apiError("profile_update_failed", updateError.message, 400);

  return apiOk({ brandBot: updatedProfile.theme.brand_bot });
}
