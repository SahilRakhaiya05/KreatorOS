import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <p className="mt-5 text-sm font-medium uppercase tracking-wide text-destructive">Auth error</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">We could not finish sign in.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Something went wrong while finishing sign in. Please try again.
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
