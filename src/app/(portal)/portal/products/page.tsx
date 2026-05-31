import Link from "next/link";
import { ChevronLeft, FolderLock } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { portalService } from "@/server/portal/portalService";
import { ProductList } from "@/features/portal/components/productList";

export const runtime = "nodejs";

export default async function PortalProducts() {
  const { customer, workspaceId } = await portalService.requirePortalCustomer();

  const supabase = await createSupabaseServerClient();

  // 1. Fetch active access grants for this customer
  const { data: grants } = await supabase
    .from("access_grants")
    .select("offer_id, expires_at")
    .eq("workspace_id", workspaceId)
    .eq("customer_id", customer.id)
    .eq("status", "active");

  const activeGrants = (grants ?? []).filter((grant) => {
    if (grant.expires_at && new Date(grant.expires_at) <= new Date()) {
      return false;
    }
    return true;
  });

  const offerIds = activeGrants.map((g) => g.offer_id).filter(Boolean);

  let products: any[] = [];

  // 2. Query products matching the transacted offers in the active workspace
  if (offerIds.length > 0) {
    const { data: dbProducts } = await supabase
      .from("products")
      .select("id, title, description, file_url, offer_id")
      .eq("workspace_id", workspaceId)
      .in("offer_id", offerIds);
    products = dbProducts ?? [];
  } else {
    // Demo fallback: if no real purchases yet, show matching offers the customer bought (from orders table)
    const orders = await portalService.getCustomerOrders(customer.id);
    const orderOfferIds = orders.map(o => o.offer_id).filter(Boolean);
    
    if (orderOfferIds.length > 0) {
      const { data: fallbackProducts } = await supabase
        .from("products")
        .select("id, title, description, file_url, offer_id")
        .eq("workspace_id", workspaceId)
        .in("offer_id", orderOfferIds);
      products = fallbackProducts ?? [];
    }
  }

  return (
    <AppShell role="portal">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link href="/portal"><ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard</Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="My products"
        title="Purchased Files & Templates"
        description="Instantly download and access your purchased digital assets."
      />

      <div className="mt-6">
        <ProductList
          workspaceId={workspaceId}
          customerId={customer.id}
          initialProducts={products}
        />
      </div>
    </AppShell>
  );
}
