import { z, type ZodSchema } from "zod";

export function parseStructuredOutput<T>(schema: ZodSchema<T>, value: unknown) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new z.ZodError(result.error.issues);
  }
  return result.data;
}
