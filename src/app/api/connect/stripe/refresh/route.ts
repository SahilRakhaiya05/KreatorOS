import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/creator/settings?stripe=refresh`);
}
