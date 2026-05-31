import {
  Bot, Calendar, CreditCard, FileText, Gift, Globe2, Handshake, Inbox, LayoutDashboard,
  LockKeyhole, MessageCircle, PlayCircle, Rocket, Settings, ShoppingBag,
  Sparkles, Store, Users, Wand2, Zap, BarChart3, Brain, Route, ClipboardList, PhoneCall,
  Mic, Languages, ShieldCheck, Workflow
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
export type NavGroup = { group: string; items: NavItem[] };

export const nav: Record<"creator" | "brand" | "portal", NavGroup[]> = {
  creator: [
    {
      group: "Workspace",
      items: [
        { href: "/creator", label: "Command", icon: LayoutDashboard },
        { href: "/creator/chat", label: "AI Operator", icon: Bot },
      ],
    },
    {
      group: "Build",
      items: [
        { href: "/creator/link", label: "Smart Link", icon: Rocket },
      ],
    },
    {
      group: "Smart Link",
      items: [
        { href: "/creator/link/products", label: "Products", icon: Store },
        { href: "/creator/link/shortlinks", label: "Short Links", icon: Route },
        { href: "/creator/link/wallet", label: "Wallet", icon: CreditCard },
        { href: "/creator/link/affiliate", label: "Affiliates & Referrals", icon: Gift },
        { href: "/creator/link/assistant", label: "AI Assistant", icon: Bot },
      ],
    },
    {
      group: "Automate",
      items: [
        { href: "/creator/agents", label: "Agents", icon: Sparkles },
        { href: "/creator/workflows", label: "KOffice", icon: Workflow },
        { href: "/creator/calendar", label: "Calendar", icon: Calendar },
      ],
    },
    {
      group: "Grow",
      items: [
        { href: "/creator/brand-crm", label: "Brand CRM", icon: Handshake },
        { href: "/creator/research-lab", label: "Research Lab", icon: Mic },
        { href: "/creator/instagram", label: "Instagram Saves", icon: PlayCircle },
        { href: "/creator/link/analytics", label: "Analytics", icon: BarChart3 },
      ],
    },
  ],
  brand: [
    {
      group: "Workspace",
      items: [
        { href: "/brand", label: "Brand HQ", icon: LayoutDashboard },
        { href: "/brand/discover", label: "Discover", icon: Users },
      ],
    },
    {
      group: "Campaigns",
      items: [
        { href: "/brand/campaigns", label: "Campaigns", icon: ClipboardList },
        { href: "/brand/collab-room", label: "Collab Room", icon: MessageCircle },
      ],
    },
  ],
  portal: [
    {
      group: "Workspace",
      items: [{ href: "/portal", label: "My Portal", icon: LayoutDashboard }],
    },
    {
      group: "Access",
      items: [
        { href: "/portal/bookings", label: "Bookings", icon: Calendar },
        { href: "/portal/products", label: "Products", icon: ShoppingBag },
        { href: "/portal/membership", label: "Membership", icon: LockKeyhole },
        { href: "/portal/instagram", label: "Instagram Saves", icon: PlayCircle },
      ],
    },
  ],
};
