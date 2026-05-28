import { createHash } from "crypto";

export function createIdempotencyKey(parts: Array<string | number | boolean | null | undefined>) {
  return createHash("sha256")
    .update(parts.map((part) => String(part ?? "")).join(":"))
    .digest("hex");
}
