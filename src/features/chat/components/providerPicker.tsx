"use client";

import { Cpu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProviderId } from "@/server/ai/providers";
import type { ProviderCatalogEntry } from "../lib/types";

export function ProviderPicker({
  catalog,
  provider,
  model,
  onProviderChange,
  onModelChange,
}: {
  catalog: ProviderCatalogEntry[];
  provider: ProviderId;
  model: string;
  onProviderChange: (id: ProviderId) => void;
  onModelChange: (id: string) => void;
}) {
  const active = catalog.find((p) => p.id === provider) ?? catalog[0];
  return (
    <div className="flex items-center gap-2">
      <Cpu className="h-4 w-4 text-muted-foreground" />
      <Select value={provider} onValueChange={(v) => onProviderChange(v as ProviderId)}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {catalog.map((p) => (
            <SelectItem key={p.id} value={p.id} disabled={!p.available}>
              {p.label}
              {!p.available ? " · no key" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={model} onValueChange={onModelChange}>
        <SelectTrigger className="h-8 w-[170px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {active.models.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
