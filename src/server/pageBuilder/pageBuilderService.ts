import { notFound } from "next/navigation";

import type { CreatorPageBlockRecord, CreatorPageRecord } from "../../features/bioBuilder/types";
import { requireUser } from "../profile/profileService";
import { createSupabaseServerClient } from "../supabase/serverClient";

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "creator";
}

export async function getBuilderPageData() {
  const { user, profile } = await requireUser();
  const supabase = await createSupabaseServerClient();
  const displayName = profile?.full_name || user.email?.split("@")[0] || "KreatorOS Creator";
  const slug = slugify(profile?.full_name || user.email || user.id);

  let { data: page } = await supabase
    .from("creator_pages")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!page) {
    const { data: createdPage, error } = await supabase
      .from("creator_pages")
      .insert({
        owner_id: user.id,
        slug,
        display_name: displayName,
        handle: `@${slug}`,
        bio: "Build, book, sell, and automate from one clean creator page.",
        avatar_url: profile?.avatar_url ?? null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    page = createdPage;

    await supabase.from("creator_page_blocks").insert([
      {
        page_id: page.id,
        type: "link",
        title: "Start here",
        subtitle: "Explore my latest offer",
        url: "https://kreatoros.ai",
        sort_order: 0,
      },
      {
        page_id: page.id,
        type: "calendar",
        title: "Book a strategy call",
        subtitle: "30 minute intro session",
        sort_order: 1,
        metadata: { duration: "30 min", timezone: "Local time", availability: ["Mon", "Wed", "Fri"] },
      },
    ]);
  }

  const { data: blocks, error: blocksError } = await supabase
    .from("creator_page_blocks")
    .select("*")
    .eq("page_id", page.id)
    .order("sort_order", { ascending: true });

  if (blocksError) {
    throw new Error(blocksError.message);
  }

  return {
    page: page as CreatorPageRecord,
    blocks: (blocks ?? []) as CreatorPageBlockRecord[],
  };
}

export async function getPublicCreatorPage(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data: page } = await supabase
    .from("creator_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  const { data: blocks } = await supabase
    .from("creator_page_blocks")
    .select("*")
    .eq("page_id", page.id)
    .eq("status", "live")
    .order("sort_order", { ascending: true });

  return {
    page: page as CreatorPageRecord,
    blocks: (blocks ?? []) as CreatorPageBlockRecord[],
  };
}
