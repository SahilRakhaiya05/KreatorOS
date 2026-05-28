"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, FileArchive, FolderLock, Sparkles, Loader2, AlertCircle } from "lucide-react";

type Product = {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  offer_id: string | null;
};

type ProductListProps = {
  workspaceId: string;
  customerId: string;
  initialProducts: Product[];
};

export function ProductList({ workspaceId, customerId, initialProducts }: ProductListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  const handleDownload = async (productId: string) => {
    setDownloadingId(productId);
    setErrorMap((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

    try {
      const res = await fetch("/api/products/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          customerId,
          productId,
        }),
      });

      const json = await res.json();

      if (json.ok && json.data?.downloadUrl) {
        // Trigger browser file download securely
        window.location.href = json.data.downloadUrl;
      } else {
        const errorMsg = json.error?.message || "Failed to retrieve the file link.";
        setErrorMap((prev) => ({ ...prev, [productId]: errorMsg }));
      }
    } catch {
      setErrorMap((prev) => ({ ...prev, [productId]: "An unexpected error occurred." }));
    } finally {
      setDownloadingId(null);
    }
  };

  if (!initialProducts || initialProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground">
          <FolderLock className="h-7 w-7 text-accent" />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">No products purchased</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Any digital downloads, templates, worksheets, or files you purchase from this creator will appear here immediately for easy download.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {initialProducts.map((product) => {
        const isDownloading = downloadingId === product.id;
        const errorMsg = errorMap[product.id];
        const isZip = product.file_url?.toLowerCase().endsWith(".zip") || product.file_url?.toLowerCase().endsWith(".rar");

        return (
          <Card
            key={product.id}
            className="group flex flex-col overflow-hidden border border-border/60 bg-card transition-all duration-300 hover:translate-y-[-2px] hover:border-accent/40 hover:shadow-soft"
          >
            <div className="h-2 w-full bg-gradient-to-r from-accent via-violet-500 to-indigo-600 opacity-80" />
            <CardHeader className="space-y-1 pb-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                  Access Granted
                </Badge>
                {isZip ? (
                  <FileArchive className="h-5 w-5 text-indigo-500 transition-transform group-hover:scale-110" />
                ) : (
                  <FileText className="h-5 w-5 text-accent transition-transform group-hover:scale-110" />
                )}
              </div>
              <CardTitle className="pt-2 text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
                {product.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {product.description || "Digital download product delivery file. Secure and verified."}
              </p>
              
              {errorMsg && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-secondary/20 border-t border-border/40 py-3 px-6">
              <Button
                onClick={() => handleDownload(product.id)}
                disabled={isDownloading}
                className="w-full gap-2 font-medium bg-gradient-to-r from-primary to-violet-700 hover:from-primary/90 hover:to-violet-800 shadow-sm"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Resolving Link...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 group-hover:animate-pulse" />
                    <span>Download Asset</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
