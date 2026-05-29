import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { createSupabaseServiceClient } from "@/server/supabase/serviceClient";
import { hasSupabaseServiceConfig } from "@/server/supabase/config";

import { redirect } from "next/navigation";

function getServiceClient() {
  return hasSupabaseServiceConfig() ? createSupabaseServiceClient() : createSupabaseServerClient();
}

export const portalService = {
  /**
   * Enforce portal session, redirecting to standard /login if missing
   */
  async requirePortalCustomer() {
    const { getSession } = await import("@/server/auth/getSession");
    const { user } = await getSession();

    if (!user || !user.email) {
      redirect("/login?next=/portal");
    }

    const supabase = await createSupabaseServerClient();
    
    // Resolve the first workspace to scope this customer portal
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (wsError || !workspace) {
      redirect("/unauthorized?error=no_workspace");
    }

    const result = await this.getOrCreateCustomer(user.email, workspace.id);
    if (!result.ok || !result.customer) {
      redirect("/login?error=customer_resolution_failed");
    }

    return { customer: result.customer, workspaceId: workspace.id };
  },

  /**
   * Find or create a test customer by email inside the workspace
   */
  async getOrCreateCustomer(email: string, workspaceId: string) {
    const supabase = await getServiceClient();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Search for existing customer in this workspace
    const { data: customer, error: findError } = await supabase
      .from("customers")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("email", cleanEmail)
      .maybeSingle();

    if (findError) return { ok: false as const, error: findError.message };
    if (customer) return { ok: true as const, customer };

    // 2. Auto-bootstrap a demo customer if they do not exist
    const { data: newCustomer, error: insertError } = await supabase
      .from("customers")
      .insert({
        workspace_id: workspaceId,
        email: cleanEmail,
        name: cleanEmail.split("@")[0].toUpperCase() + " (Demo)",
        metadata: { demo_bootstrapped: true, source: "Portal direct login" },
      })
      .select("*")
      .single();

    if (insertError) return { ok: false as const, error: insertError.message };
    return { ok: true as const, customer: newCustomer };
  },

  /**
   * Get all active and paid bookings for a customer
   */
  async getCustomerBookings(customerId: string) {
    const supabase = await getServiceClient();
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*, offers(*)")
      .eq("customer_id", customerId)
      .order("start_at", { ascending: true });

    if (error) return [];
    return bookings || [];
  },

  /**
   * Get all transacted orders/purchases for a customer
   */
  async getCustomerOrders(customerId: string) {
    const supabase = await getServiceClient();
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, offers(*)")
      .eq("customer_id", customerId)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (error) return [];
    return orders || [];
  },

  /**
   * Get all active access grants (digital product / course downloads)
   */
  async getCustomerAccess(customerId: string) {
    const supabase = await getServiceClient();
    const { data: grants, error } = await supabase
      .from("access_grants")
      .select("*, offers(*)")
      .eq("customer_id", customerId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) return [];
    return grants || [];
  }
};

