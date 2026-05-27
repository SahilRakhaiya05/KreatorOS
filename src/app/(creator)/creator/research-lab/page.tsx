import { AppShell } from "@/components/layout/appShell";
import { ResearchLab } from "@/features/research/components/researchLab";
import { PageTitle } from "@/components/ui";
export default function Page(){return <AppShell role="creator"><div className="space-y-6"><PageTitle eyebrow="Research lab" title="Askiva-inspired AI research automation for creators and brands." text="Run customer interviews on autopilot: import participants, send outreach, schedule sessions, interview with AI, transcribe, summarize themes, and turn insights into offers."/><ResearchLab/></div></AppShell>}
