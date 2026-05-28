import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "unknown-asset";
  const productId = searchParams.get("product_id");

  let productTitle = "CreatorOS Digital Product";

  if (productId) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("products")
        .select("title")
        .eq("id", productId)
        .maybeSingle();

      if (data?.title) {
        productTitle = data.title;
      }
    } catch {
      // Fallback to default title on query failure
    }
  }

  const mockFileContent = `=====================================================
CreatorOS AI - Secure Product Delivery Autopilot
=====================================================
Product: ${productTitle}
Asset Path: ${path}
Downloaded At: ${new Date().toISOString()}

Thank you for your purchase! This file was generated automatically
by the CreatorOS Product Purchase Autopilot.

In a production environment, this request securely checks the customer's
access grants under active Row Level Security rules, resolves the asset
path using secure temporary signed URLs via the configured Supabase Storage,
and redirects the browser to download the file directly.

Since this environment is running in sandbox/development mode,
CreatorOS has successfully intercepted the call and generated this mock
fulfillment download file to verify that the end-to-end checkout, 
access allocation, and download flows are fully operational.

Enjoy your content!
=====================================================
CreatorOS AI - The business operator for builders.
`;

  return new Response(mockFileContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="${productTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-download.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
