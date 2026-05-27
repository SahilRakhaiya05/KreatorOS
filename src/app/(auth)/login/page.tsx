import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthPanel } from "../../../features/auth/components/authPanel";
import { getPostAuthRedirect, getCurrentUserAndProfile } from "../../../server/profile/profileService";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user) {
    redirect(getPostAuthRedirect(profile));
  }

  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-background text-sm font-medium text-muted-foreground">Loading auth...</div>}>
      <AuthPanel />
    </Suspense>
  );
}
