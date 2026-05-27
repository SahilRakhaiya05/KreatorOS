import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const owned = ["Creator AI Templates", "Prompt Vault Pro", "Business Audit Bundle"];

export default function PortalProducts() {
  return (
    <AppShell role="portal">
      <PageHeader
        eyebrow="My products"
        title="Purchased files, templates, bundles, and receipts"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {owned.map((x) => (
          <Card key={x} className="flex flex-col transition hover:shadow-soft">
            <CardHeader className="space-y-0 pb-2">
              <Badge variant="success" className="w-fit">Owned</Badge>
              <CardTitle className="pt-3 text-lg">{x}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1" />
            <CardFooter>
              <Button className="w-full">Open</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
