import { BriefcaseBusiness, Crown, Sparkles, UserRound, type LucideIcon } from "lucide-react";

import type { AccountType } from "../types";

export type AccountTypeOption = {
  value: AccountType;
  label: string;
  description: string;
  dashboardHref: string;
  icon: LucideIcon;
};

export const accountTypeOptions: AccountTypeOption[] = [
  {
    value: "user",
    label: "User",
    description: "Access bookings, products, memberships, and creator purchases.",
    dashboardHref: "/portal",
    icon: UserRound,
  },
  {
    value: "creator",
    label: "Creator",
    description: "Build public pages, offers, bookings, workflows, and AI operators.",
    dashboardHref: "/creator",
    icon: Sparkles,
  },
  {
    value: "business",
    label: "Business",
    description: "Run brand campaigns, creator discovery, approvals, and collaboration.",
    dashboardHref: "/brand",
    icon: BriefcaseBusiness,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage operations, provider setup, safety review, and platform controls.",
    dashboardHref: "/brand",
    icon: Crown,
  },
];

export function getDashboardForAccountType(accountType?: AccountType | null) {
  return accountTypeOptions.find((option) => option.value === accountType)?.dashboardHref ?? "/portal";
}

export function isAccountType(value: string): value is AccountType {
  return accountTypeOptions.some((option) => option.value === value);
}
