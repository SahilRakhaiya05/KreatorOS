"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authRoutes } from "../config/authRoutes";
import { hasSupabaseConfig } from "../../../server/supabase/config";
import { createSupabaseServerClient } from "../../../server/supabase/serverClient";
import { createWorkspaceForUser } from "../../../server/workspaces/workspaceService";
import { sendWelcomeEmail } from "@/server/notifications/welcomeEmail";
import type { WorkspaceType } from "../../../server/auth/permissions";
import { getDashboardForAccountType, isAccountType } from "../config/accountTypes";
import type { AccountType } from "../types";

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

function accountTypeToWorkspaceType(accountType: AccountType): WorkspaceType {
  if (accountType === "business") return "brand";
  if (accountType === "admin") return "admin";
  return "creator";
}

export async function completeOnboardingAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const configError = requireSupabaseConfig();
  if (configError) return { status: "error", message: configError };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const focus = String(formData.get("focus") ?? "").trim();
  const primaryGoal = String(formData.get("primaryGoal") ?? "").trim();
  const audience = String(formData.get("audience") ?? "").trim();
  const submittedAccountType = String(formData.get("accountType") ?? "creator");
  const accountType = isAccountType(submittedAccountType) ? submittedAccountType : "creator";
  const workspaceType = accountTypeToWorkspaceType(accountType);

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

  const workspaceResult = await createWorkspaceForUser({
    userId: user.id,
    name: `${fullName} ${workspaceType === "brand" ? "Brand" : "Creator"}`,
    type: workspaceType,
    avatarUrl: avatarUrl || null,
  });

  if (!workspaceResult.ok) {
    return { status: "error", message: workspaceResult.error.message || defaultError };
  }

  // Load existing profile to preserve details or check welcome email status
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  const existingPrefs = (existingProfile?.preferences as Record<string, any>) || {};
  const isEmailSent = existingPrefs.welcome_email_sent === true;
  let welcomeEmailSent = isEmailSent;

  if (!isEmailSent) {
    const welcomeResult = await sendWelcomeEmail({
      email: user.email || "",
      fullName,
    });
    if (welcomeResult.ok) {
      welcomeEmailSent = true;
    }
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    avatar_url: avatarUrl || null,
    account_type: accountType,
    active_workspace_id: workspaceResult.workspace.id,
    onboarding_completed: true,
    preferences: {
      focus,
      primaryGoal,
      audience,
      accountType,
      workspaceType,
      welcome_email_sent: welcomeEmailSent,
    },
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { status: "error", message: error.message || defaultError };
  }

  // Auto-register creator profile on onboarding
  if (workspaceType === "creator") {
    const username = user.email ? user.email.split("@")[0].replace(/[^a-z0-9]/gi, "_").toLowerCase() : "creator";
    try {
      await supabase.from("creator_profiles").upsert({
        owner_id: user.id,
        workspace_id: workspaceResult.workspace.id,
        display_name: fullName,
        username: username,
        niche: focus || "AI Productivity & Systems Architect",
        audience: audience || "tech founders, solo creators, systems engineers",
        promise: primaryGoal || "Scale your business operations using custom-built AI-driven automation workflows and integrations.",
        status: "published"
      }, { onConflict: "workspace_id" });
    } catch (e) {
      console.error("Auto-register creator profile on onboarding failed:", e);
    }
  }

  revalidatePath("/");
  redirect(getDashboardForAccountType(accountType));
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

  // Also update creator profile record if exists in the database
  try {
    await supabase
      .from("creator_profiles")
      .update({
        display_name: fullName,
        niche: focus || undefined,
        audience: audience || undefined,
        promise: primaryGoal || undefined,
      })
      .eq("owner_id", user.id);
  } catch (e) {
    console.error("Update creator profile record failed:", e);
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
