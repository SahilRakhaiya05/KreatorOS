import { NextRequest } from "next/server";
import { handleCopilotKitRequest } from "@/server/copilotkit/runtime";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleCopilotKitRequest(req);
}

export async function GET(req: NextRequest) {
  return handleCopilotKitRequest(req);
}
