import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/server/utils/url";

export async function GET(req: Request) {
  const origin = getRequestOrigin(req);
  return NextResponse.redirect(`${origin}/creator/settings?stripe=refresh`);
}
