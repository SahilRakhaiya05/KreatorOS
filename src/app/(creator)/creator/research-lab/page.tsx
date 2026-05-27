import { AppShell, PageHeader } from "@/components/layout/appShell";
import { ResearchLab } from "@/features/research/components/researchLab";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Research lab"
        title="Askiva-inspired AI research automation"
        description="Run customer interviews on autopilot: import participants, send outreach, schedule sessions, interview with AI, transcribe, summarize themes, and turn insights into offers."
      />
      <ResearchLab />
    </AppShell>
  );
}
