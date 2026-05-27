import { redirect } from "next/navigation";

import { OnboardingForm } from "../../../features/onboarding/components/onboardingForm";
import { getPostAuthRedirect, requireUser } from "../../../server/profile/profileService";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { profile } = await requireUser();

  if (profile?.onboarding_completed && profile.full_name && profile.account_type) {
    redirect(getPostAuthRedirect(profile));
  }

  return <OnboardingForm profile={profile} />;
}
