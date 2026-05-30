import { redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InstagramLibrary } from "@/features/instagramCapture/components/instagramLibrary";
import { getActiveWorkspace } from "@/server/auth/getActiveWorkspace";
import { getSession } from "@/server/auth/getSession";
import { listInstagramCaptures } from "@/server/instagram/captureService";

export const runtime = "nodejs";

export default async function InstagramCapturePage() {
  const { user } = await getSession();
  if (!user) redirect("/login?next=/creator/instagram");

  const workspace = await getActiveWorkspace(user.id);
  if (!workspace) redirect("/unauthorized?next=/creator/instagram");

  const captures = await listInstagramCaptures({ userId: user.id, workspaceId: workspace.id });
  const rows = captures.ok ? captures.data : [];

  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Instagram library"
        title="Save reels and posts into a searchable idea base"
        description="Captured Instagram items are analyzed with Gemini when available, then stored like a lightweight Notion database for search, tags, topics, and remix ideas."
        action={<Badge variant="accent">{rows.length} saved</Badge>}
      />

      {!process.env.GOOGLE_GENERATIVE_AI_API_KEY ? (
        <Card className="mb-5 border-amber-500/25 bg-amber-500/10">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-amber-500">Gemini key not configured</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Saves still work with fallback analysis. Add <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">GOOGLE_GENERATIVE_AI_API_KEY</code> to enable Gemini summaries, tags, and remix ideas.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <InstagramLibrary captures={rows} />
    </AppShell>
  );
}
