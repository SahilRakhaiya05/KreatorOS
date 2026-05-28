export type CreatorEvent = {
  type: string;
  workspaceId: string;
  pageId?: string;
  ownerId?: string;
  actorType: "visitor" | "customer" | "creator" | "brand" | "system" | "agent" | "provider";
  actorId?: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
};
