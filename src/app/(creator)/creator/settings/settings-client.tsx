"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Calendar,
  Video,
  Loader2,
  ArrowUpRight,
  PlugZap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5 pr-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 justify-start sm:w-64 sm:justify-end [&>*]:w-full sm:[&>button]:w-auto">{children}</div>
    </div>
  );
}

function ConnectorRow({
  icon: Icon,
  name,
  description,
  provider,
}: {
  icon: typeof Calendar;
  name: string;
  description: string;
  provider: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function connect() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/connect/${provider}`, { method: "POST" });
      const json = await res.json();
      if (json?.ok && json.data?.url) {
        window.location.href = json.data.url as string;
        return;
      }
      setStatus(json?.error?.message ?? "Something went wrong.");
    } catch {
      setStatus("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 pr-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={connect} disabled={loading} className="shrink-0">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Connect
      </Button>
    </div>
  );
}

function StripeCard({ stripeConnected }: { stripeConnected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/connect/stripe", { method: "POST" });
      const json = await res.json();
      if (json?.ok && json.data?.url) {
        window.location.href = json.data.url as string;
        return;
      }
      setError(json?.error?.message ?? "We couldn't start the connection.");
    } catch {
      setError("We couldn't start the connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Stripe</CardTitle>
            <CardDescription>Let creators connect their own Stripe account for checkout and payouts.</CardDescription>
          </div>
        </div>
        {stripeConnected ? (
          <Badge variant="success">Connected</Badge>
        ) : (
          <Badge variant="secondary">Core</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {stripeConnected ? "Your connected Stripe account is ready for checkout." : "Connect the Stripe account you own. KreatorOS stores only the connected account ID and readiness status."}
          </p>
          <Button onClick={connect} disabled={loading} className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {stripeConnected ? "Refresh Stripe account" : "Connect your Stripe account"}
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function statusVariant(status: string) {
  if (status === "connected") return "success" as const;
  if (status === "sandbox" || status === "mock_mode") return "warning" as const;
  if (status === "error" || status === "needs_reauth") return "destructive" as const;
  return "secondary" as const;
}

type ProviderStatus = {
  provider: string;
  label: string;
  status: string;
  requiredFor: string;
};

function ProviderStatusShell() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadProviders() {
      try {
        const res = await fetch("/api/providers/status");
        const json = await res.json();
        if (!cancelled && json?.ok) {
          setProviders(json.data.providers ?? []);
        }
      } catch {
        setProviders([]);
      }
    }

    loadProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PlugZap className="h-5 w-5 text-muted-foreground" />
          Provider status
        </CardTitle>
        <CardDescription>Production features stay blocked until the required provider is configured.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border pt-0">
        {providers.length ? providers.map((provider) => (
          <div key={provider.provider} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{provider.label}</p>
              <p className="text-sm text-muted-foreground">{provider.requiredFor}</p>
            </div>
            <Badge variant={statusVariant(provider.status)}>{provider.status.replace(/_/g, " ")}</Badge>
          </div>
        )) : (
          <div className="py-4 text-sm text-muted-foreground">Provider status loads after workspace auth is available.</div>
        )}
      </CardContent>
    </Card>
  );
}

export function SettingsClient({ stripeConnected }: { stripeConnected: boolean }) {
  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="connectors">Connectors</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>How you appear across your storefront and bookings.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <SettingRow title="Display name" description="Shown on your public page and receipts.">
              <Input placeholder="Your display name" />
            </SettingRow>
            <SettingRow title="Handle" description="Your unique storefront URL.">
              <Input placeholder="your-username" />
            </SettingRow>
            <SettingRow title="Timezone" description="Used for bookings and scheduling.">
              <Select defaultValue="ist">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">India Standard Time (GMT+5:30)</SelectItem>
                  <SelectItem value="pst">Pacific Time (GMT-8)</SelectItem>
                  <SelectItem value="est">Eastern Time (GMT-5)</SelectItem>
                  <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payments" className="space-y-6">
        <StripeCard stripeConnected={stripeConnected} />
      </TabsContent>

      <TabsContent value="connectors" className="space-y-6">
        <ProviderStatusShell />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Optional add-ons</CardTitle>
            <CardDescription>
              Extra connectors for calendar and meetings. Each creator connects their own Stripe account from Payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <ConnectorRow
              icon={Calendar}
              name="Google Calendar"
              description="Sync availability and booked sessions."
              provider="google-calendar"
            />
            <ConnectorRow
              icon={Video}
              name="Google Meet"
              description="Auto-generate meeting links for calls."
              provider="google-meet"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email notifications</CardTitle>
            <CardDescription>Choose what lands in your inbox.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <SettingRow title="Account & security" description="Important updates about your account.">
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow title="Product sales" description="Get notified when someone buys a product.">
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow title="New bookings" description="Alerts when a session is booked.">
              <Switch />
            </SettingRow>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
