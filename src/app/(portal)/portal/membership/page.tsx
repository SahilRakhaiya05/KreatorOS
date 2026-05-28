import { AppShell, PageHeader } from "@/components/layout/appShell";
import { getSession } from "@/server/auth/getSession";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { MembershipHub } from "@/features/portal/components/membershipHub";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function PortalMembership() {
  const { user } = await getSession();
  if (!user || !user.email) {
    redirect("/login?next=/portal/membership");
  }

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) {
    redirect("/unauthorized?next=/portal/membership");
  }

  const supabase = await createSupabaseServerClient();

  // 1. Fetch customer details in the active workspace
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("email", user.email.trim().toLowerCase())
    .maybeSingle();

  let memberships: any[] = [];
  let courses: any[] = [];

  if (customer) {
    // 2. Fetch active access grants
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

    if (offerIds.length > 0) {
      // 3. Query matching membership plans
      const { data: dbMemberships } = await supabase
        .from("membership_plans")
        .select("id, name, benefits, billing_interval")
        .eq("workspace_id", workspace.id)
        .in("offer_id", offerIds);

      memberships = (dbMemberships ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        benefits: Array.isArray(m.benefits) ? m.benefits : [],
        billing_interval: m.billing_interval || "month",
      }));

      // 4. Query matching courses
      const { data: dbCourses } = await supabase
        .from("courses")
        .select("id, title, description")
        .eq("workspace_id", workspace.id)
        .eq("status", "published")
        .in("offer_id", offerIds);

      if (dbCourses && dbCourses.length > 0) {
        const courseIds = dbCourses.map((c) => c.id);

        // Fetch corresponding lessons
        const { data: dbLessons } = await supabase
          .from("course_lessons")
          .select("id, course_id, title, content, sort_order")
          .eq("workspace_id", workspace.id)
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
  }

  return (
    <AppShell role="portal">
      <PageHeader
        eyebrow="Membership & Learning"
        title="Gated posts, office hours, resources, and community updates"
        description="Access exclusive subscriber benefits and view your enrolled course curricula from one centralized dashboard."
      />

      <MembershipHub memberships={memberships} courses={courses} />
    </AppShell>
  );
}
