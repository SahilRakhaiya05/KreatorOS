import { apiError } from "@/server/api/responses";
import { getSession } from "@/server/auth/getSession";

export async function POST() {
  const { user } = await getSession();
  if (!user) return apiError("unauthorized", "Sign in to manage your account.", 401);

  return apiError(
    "account_role_locked",
    "KreatorOS routes dashboards from the onboarding account role. Update the profile role instead of switching dashboards.",
    410
  );
}
