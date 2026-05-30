import { AppShell } from "@/components/layout/appShell";
import { ChatWorkspace } from "@/features/chat/components/chatWorkspace";
import { providerCatalog } from "@/server/ai/providers";

export const metadata = { title: "AI Chat - KreatorOS" };

export default function CreatorChatPage() {
  const catalog = providerCatalog();
  const isMissingServiceKey = !process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <AppShell role="creator">
      {isMissingServiceKey && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="font-semibold text-amber-500">Action Required: Missing SUPABASE_SERVICE_ROLE_KEY</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            The AI Operator requires the <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> in your <code className="rounded bg-secondary px-1 py-0.5 font-mono text-xs">.env.local</code> to auto-heal and manage your workspace session. Please add the service_role key from your Supabase Dashboard settings and restart your local dev server.
          </p>
        </div>
      )}
      <ChatWorkspace catalog={catalog} />
    </AppShell>
  );
}
