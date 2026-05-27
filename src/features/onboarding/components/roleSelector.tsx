import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { onboardingEntries, onboardingPromise } from "../config/onboardingSteps";

export function RoleSelector() {
  const PromiseIcon = onboardingPromise.icon;

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-5xl py-16">
        <Badge variant="accent" className="mb-6 gap-1.5">
          <PromiseIcon className="h-3.5 w-3.5" />
          KreatorOS workspace router
        </Badge>
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-accent">{onboardingPromise.eyebrow}</p>
        <h1 className="max-w-5xl font-display text-3xl font-semibold tracking-tight md:text-5xl">{onboardingPromise.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{onboardingPromise.text}</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {onboardingEntries.map((entry) => {
            const Icon = entry.icon;

            return (
              <Card key={entry.role}>
                <CardContent className="p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 font-display text-xl font-semibold">{entry.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</p>
                  <Button asChild className="mt-5">
                    <Link href={entry.href}>
                      Enter {entry.role}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
