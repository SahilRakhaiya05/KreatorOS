import { AppShell, PageHeader } from "@/components/layout/appShell";
import { PublicPreview } from "@/features/bioBuilder/components/bioBuilder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const states = [
  "Anonymous visitor",
  "Returning buyer",
  "Paid member",
  "Brand company",
  "Mobile Instagram click",
  "Desktop SEO visitor",
];

export default function Page() {
  return (
    <AppShell role="creator">
      <PageHeader
        eyebrow="Public preview studio"
        title="Preview every visitor experience before publishing"
        description="Preview mobile, desktop, buyer, member, brand, and returning-customer versions of the page."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <Card>
          <CardHeader>
            <CardTitle>Preview states</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {states.map((x) => (
                <div key={x} className="rounded-xl border border-border bg-secondary/60 p-4 transition hover:shadow-soft">
                  <Badge variant="accent">State</Badge>
                  <p className="mt-3 font-semibold tracking-tight">{x}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AI can personalize ordering, CTA, language, and offers for this visitor context.
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <PublicPreview />
      </div>
    </AppShell>
  );
}
