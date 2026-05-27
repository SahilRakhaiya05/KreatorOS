import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicPreview } from "@/features/bioBuilder/components/bioBuilder";
import { Button } from "@/components/ui/button";

export default function PublicPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-12">
        <PublicPreview />
        <Button asChild variant="outline">
          <Link href="/creator/preview">
            <ArrowLeft className="h-4 w-4" /> Back to preview studio
          </Link>
        </Button>
      </div>
    </main>
  );
}
