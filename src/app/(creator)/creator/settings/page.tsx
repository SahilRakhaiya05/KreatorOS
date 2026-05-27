import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { providerServices } from "@/shared/mock/data";
import { Plug } from "lucide-react";

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Settings + providers"
        title="Connect every provider the business needs"
        description="KreatorOS is provider-flexible: start with Supabase, Stripe, Google Calendar, Resend, WhatsApp, and OpenAI, then add adapters."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providerServices.map((p) => (
          <Card key={p.category} className="transition hover:shadow-soft">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Plug className="h-[18px] w-[18px]" />
                </div>
                <CardTitle className="text-base">{p.category}</CardTitle>
              </div>
              <Badge variant="secondary">Adapter</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-foreground">{p.providers}</p>
              <CardDescription className="leading-6">{p.use}</CardDescription>
              <Button variant="outline" size="sm" className="w-full">
                Configure
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
