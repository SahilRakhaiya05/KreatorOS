export type AiToolPermission = "read_page" | "write_page" | "read_offers" | "write_offers" | "read_analytics" | "send_messages";

export const toolRegistry = {
  create_page_block: { permissions: ["write_page"] satisfies AiToolPermission[], approval: "medium" },
  update_offer: { permissions: ["write_offers"] satisfies AiToolPermission[], approval: "high" },
  read_analytics: { permissions: ["read_analytics"] satisfies AiToolPermission[], approval: "low" },
  draft_message: { permissions: ["send_messages"] satisfies AiToolPermission[], approval: "high" },
} as const;
