import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Workspace access needed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area belongs to a different workspace type or role. Switch workspaces, or ask an owner to invite you.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/creator">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile/settings">Profile settings</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
