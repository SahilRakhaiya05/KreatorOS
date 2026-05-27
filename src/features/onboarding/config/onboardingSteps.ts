import { Bot, Building2, User, Users, type LucideIcon } from "lucide-react";

import type { WorkspaceRole } from "../../auth/types";

export type OnboardingEntry = {
  role: Exclude<WorkspaceRole, "admin">;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const onboardingEntries: OnboardingEntry[] = [
  {
    role: "creator",
    title: "Creator",
    description: "Build bio pages, sell products, book calls, run memberships, manage brands, and create AI workflows.",
    href: "/creator",
    icon: User,
  },
  {
    role: "brand",
    title: "Brand",
    description: "Discover creators, launch campaigns, negotiate deliverables, approve payments, and track reports.",
    href: "/brand",
    icon: Building2,
  },
  {
    role: "portal",
    title: "Client/member",
    description: "Access purchased products, booked calls, courses, membership content, and support conversations.",
    href: "/portal",
    icon: Users,
  },
];

export const onboardingPromise = {
  eyebrow: "Role-based onboarding",
  title: "Choose your workspace",
  text: "KreatorOS keeps creator, brand, client/member, and admin experiences separate so Supabase Auth can map each account to one or more workspace roles.",
  icon: Bot,
} as const;
