import { createIdempotencyKey } from "@/server/security/idempotency";
import type { CreatorEvent } from "./types";

export function eventIdempotencyKey(event: CreatorEvent) {
  return event.idempotencyKey ?? createIdempotencyKey([event.workspaceId, event.type, event.actorType, event.actorId, JSON.stringify(event.payload)]);
}
