import { AppShell } from "@/components/layout/appShell";
import { ChatWorkspace } from "@/features/chat/components/chatWorkspace";
import { providerCatalog } from "@/server/ai/providers";

export const metadata = { title: "AI Chat — KreatorOS" };

export default function CreatorChatPage() {
  const catalog = providerCatalog();
  return (
    <AppShell role="creator">
      <ChatWorkspace catalog={catalog} />
    </AppShell>
  );
}
