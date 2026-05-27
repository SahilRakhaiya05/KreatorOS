import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function apiError(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiFailure>(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export async function parseJsonBody<T>(req: Request, schema: ZodSchema<T>) {
  try {
    return schema.parse(await req.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError("validation_error", "Request body failed validation.", 422, error.flatten());
    }

    return apiError("invalid_json", "Request body must be valid JSON.", 400);
  }
}

export function isApiResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
