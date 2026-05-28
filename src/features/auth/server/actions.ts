"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authRoutes } from "../config/authRoutes";
import { hasSupabaseConfig } from "../../../server/supabase/config";
import { createSupabaseServerClient } from "../../../server/supabase/serverClient";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultError = "Something went wrong. Please try again.";

function requireSupabaseConfig() {
  if (!hasSupabaseConfig()) {
    return "Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";
  }

  return null;
}

export async function completeOnboardingAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const configError = requireSupabaseConfig();
  if (configError) return { status: "error", message: configError };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const focus = String(formData.get("focus") ?? "").trim();
  const primaryGoal = String(formData.get("primaryGoal") ?? "").trim();
  const audience = String(formData.get("audience") ?? "").trim();

  if (!fullName) {
    return { status: "error", message: "Please enter your name." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "error", message: "Please sign in again to complete onboarding." };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    avatar_url: avatarUrl || null,
    account_type: "creator",
    onboarding_completed: true,
    preferences: { focus, primaryGoal, audience },
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { status: "error", message: error.message || defaultError };
  }

  revalidatePath("/");
  redirect("/creator");
}

export async function updateProfileAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const configError = requireSupabaseConfig();
  if (configError) return { status: "error", message: configError };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const focus = String(formData.get("focus") ?? "").trim();
  const primaryGoal = String(formData.get("primaryGoal") ?? "").trim();
  const audience = String(formData.get("audience") ?? "").trim();

  if (!fullName) {
    return { status: "error", message: "Please enter your name." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in again before updating your profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      avatar_url: avatarUrl || null,
      onboarding_completed: true,
      preferences: { focus, primaryGoal, audience },
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: error.message || defaultError };
  }

  revalidatePath(authRoutes.profileSettings);
  return { status: "success", message: "Profile updated." };
}

export async function updatePasswordAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const configError = requireSupabaseConfig();
  if (configError) return { status: "error", message: configError };

  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { status: "error", message: "Use at least 8 characters for your new password." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { status: "error", message: error.message || defaultError };
  }

  return { status: "success", message: "Password updated." };
}

export async function logoutAction() {
  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect(authRoutes.login);
}
