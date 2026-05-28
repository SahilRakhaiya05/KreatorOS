export type PageBlockType =
  | "link"
  | "calendar"
  | "product"
  | "membership"
  | "lead_magnet"
  | "brand_intake"
  | "ai_concierge";

export type CreatorPageRecord = {
  id: string;
  owner_id: string;
  slug: string;
  display_name: string;
  handle: string;
  bio: string | null;
  avatar_url: string | null;
  theme_name: string;
  layout: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CreatorPageBlockRecord = {
  id: string;
  page_id: string;
  type: PageBlockType;
  title: string;
  subtitle: string | null;
  url: string | null;
  status: "live" | "draft";
  sort_order: number;
  clicks: number;
  metadata: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type CreatorCalendarSlotRecord = {
  id: string;
  block_id: string;
  page_id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: "available" | "held" | "booked" | "blocked";
  created_at?: string;
  updated_at?: string;
};
