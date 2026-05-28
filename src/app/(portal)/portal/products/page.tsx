import { AppShell, PageHeader } from "@/components/layout/appShell";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { ProductList } from "@/features/portal/components/productList";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function PortalProducts() {
  const { user } = await getSession();
  if (!user || !user.email) {
    redirect("/login?next=/portal/products");
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) {
    redirect("/unauthorized?next=/portal/products");
  }

  const supabase = await createSupabaseServerClient();

  // 1. Fetch customer matching this email in the active workspace
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("email", user.email.trim().toLowerCase())
    .maybeSingle();

  let products: any[] = [];
  let customerId = "";

  if (customer) {
    customerId = customer.id;

    // 2. Fetch active access grants for this customer
    const { data: grants } = await supabase
      .from("access_grants")
      .select("offer_id, expires_at")
      .eq("workspace_id", workspace.id)
      .eq("customer_id", customer.id)
      .eq("status", "active");

    const activeGrants = (grants ?? []).filter((grant) => {
      if (grant.expires_at && new Date(grant.expires_at) <= new Date()) {
        return false;
      }
      return true;
    });

    const offerIds = activeGrants.map((g) => g.offer_id).filter(Boolean);

    // 3. Query the products corresponding to the active offers
    if (offerIds.length > 0) {
      const { data: dbProducts } = await supabase
        .from("products")
        .select("id, title, description, file_url, offer_id")
        .eq("workspace_id", workspace.id)
        .in("offer_id", offerIds);
      products = dbProducts ?? [];
    }
  }

  return (
    <AppShell role="portal">
      <PageHeader
        eyebrow="My products"
        title="Purchased files, templates, bundles, and receipts"
        description="Access and download secure assets delivered to your portal account immediately after purchase."
      />

      <ProductList
        workspaceId={workspace.id}
        customerId={customerId}
        initialProducts={products}
      />
    </AppShell>
  );
}
