import { Plus } from "lucide-react";

import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Button } from "@/components/ui/button";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { requireUser } from "@/server/profile/profileService";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { OfferStoreClient } from "@/features/offers/components/offerStoreClient";

export default async function Page() {
  const { user } = await requireUser();
  const workspace = await getActiveWorkspace(user.id);
  const supabase = await createSupabaseServerClient();

  const { data: page } = await supabase
    .from("creator_pages")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: offers } = workspace
    ? await supabase
        .from("offers")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: coupons } = workspace
    ? await supabase
        .from("coupons")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Store studio"
        title="Products, bookings, memberships, and courses"
        description="Offers are real workspace records. Publishing an offer creates or updates its public page block without deleting the business object."
        action={
          <Button disabled>
            <Plus className="h-4 w-4" /> Use form below
          </Button>
        }
      />
      <OfferStoreClient workspaceId={workspace?.id ?? ""} pageId={page?.id ?? null} initialOffers={offers ?? []} initialCoupons={coupons ?? []} />
    </AppShell>
  );
}
