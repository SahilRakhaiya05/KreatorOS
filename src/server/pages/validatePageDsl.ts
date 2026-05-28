import { pageDslSchema, type PageDsl } from "./pageDslSchema";

export function validatePageDsl(value: unknown): { ok: true; data: PageDsl } | { ok: false; issues: unknown } {
  const result = pageDslSchema.safeParse(value);
  if (!result.success) {
    return { ok: false, issues: result.error.flatten() };
  }
  return { ok: true, data: result.data };
}
