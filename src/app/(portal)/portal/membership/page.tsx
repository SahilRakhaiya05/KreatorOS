import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { portalService } from "@/server/portal/portalService";
import { MembershipHub } from "@/features/portal/components/membershipHub";

export const runtime = "nodejs";

export default async function PortalMembership() {
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

  let offerIds = activeGrants.map((g) => g.offer_id).filter(Boolean);

  // Demo fallback: if no real grants yet, show courses/memberships that match their paid orders history
  if (offerIds.length === 0) {
    const orders = await portalService.getCustomerOrders(customer.id);
    offerIds = orders.map(o => o.offer_id).filter(Boolean);
  }

  let memberships: any[] = [];
  let courses: any[] = [];

  if (offerIds.length > 0) {
    // 2. Query matching membership plans in this workspace
    const { data: dbMemberships } = await supabase
      .from("membership_plans")
      .select("id, name, benefits, billing_interval")
      .eq("workspace_id", workspaceId)
      .in("offer_id", offerIds);

    memberships = (dbMemberships ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      benefits: Array.isArray(m.benefits) ? m.benefits : [],
      billing_interval: m.billing_interval || "month",
    }));

    // 3. Query matching courses in this workspace
    const { data: dbCourses } = await supabase
      .from("courses")
      .select("id, title, description")
      .eq("workspace_id", workspaceId)
      .eq("status", "published")
      .in("offer_id", offerIds);

    if (dbCourses && dbCourses.length > 0) {
      const courseIds = dbCourses.map((c) => c.id);

      // Fetch corresponding lessons
      const { data: dbLessons } = await supabase
        .from("course_lessons")
        .select("id, course_id, title, content, sort_order")
        .eq("workspace_id", workspaceId)
        .eq("status", "published")
        .in("course_id", courseIds)
        .order("sort_order", { ascending: true });

      courses = dbCourses.map((course) => {
        const lessons = (dbLessons ?? [])
          .filter((lesson) => lesson.course_id === course.id)
          .map((l) => ({
            id: l.id,
            title: l.title,
            content: typeof l.content === "object" && l.content ? (l.content as Record<string, any>) : {},
            sort_order: l.sort_order,
          }));

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          lessons,
        };
      });
    }
  }

  // Double fallback: if still no courses/memberships match, auto-fetch first active ones in workspace for demo purposes
  if (memberships.length === 0 && courses.length === 0) {
    const { data: allMemberships } = await supabase
      .from("membership_plans")
      .select("id, name, benefits, billing_interval")
      .eq("workspace_id", workspaceId)
      .limit(2);

    memberships = (allMemberships ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      benefits: Array.isArray(m.benefits) ? m.benefits : ["Exclusive updates", "Strategy audits"],
      billing_interval: m.billing_interval || "month",
    }));

    const { data: allCourses } = await supabase
      .from("courses")
      .select("id, title, description")
      .eq("workspace_id", workspaceId)
      .eq("status", "published")
      .limit(1);

    if (allCourses && allCourses.length > 0) {
      const courseIds = allCourses.map(c => c.id);
      const { data: allLessons } = await supabase
        .from("course_lessons")
        .select("id, course_id, title, content, sort_order")
        .eq("workspace_id", workspaceId)
        .eq("status", "published")
        .in("course_id", courseIds)
        .order("sort_order", { ascending: true });

      courses = allCourses.map(course => {
        const lessons = (allLessons ?? [])
          .filter(l => l.course_id === course.id)
          .map(l => ({
            id: l.id,
            title: l.title,
            content: typeof l.content === "object" && l.content ? (l.content as any) : {},
            sort_order: l.sort_order,
          }));

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          lessons,
        };
      });
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
        eyebrow="Membership & Learning"
        title="Exclusive Content & Course Curricula"
        description="Centralized dashboard for exclusive subscriber benefits and active courses."
      />

      <div className="mt-6">
        <MembershipHub memberships={memberships} courses={courses} />
      </div>
    </AppShell>
  );
}
