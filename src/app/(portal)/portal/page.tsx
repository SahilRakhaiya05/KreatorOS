import Link from "next/link";
import { Calendar, ShoppingBag, BookOpen, User, LogOut, CheckCircle2, ChevronRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/appShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { portalService } from "@/server/portal/portalService";

export default async function PortalHome() {
  const { customer } = await portalService.requirePortalCustomer();

  const [bookings, orders, accessGrants] = await Promise.all([
    portalService.getCustomerBookings(customer.id),
    portalService.getCustomerOrders(customer.id),
    portalService.getCustomerAccess(customer.id),
  ]);

  const stats = [
    { label: "Booked Calls", value: bookings.length, icon: Calendar, color: "text-amber-600 bg-amber-50" },
    { label: "Products Purchased", value: orders.length, icon: ShoppingBag, color: "text-emerald-600 bg-emerald-50" },
    { label: "Active Memberships", value: accessGrants.length, icon: BookOpen, color: "text-violet-600 bg-violet-50" },
  ];

  return (
    <AppShell role="portal">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <PageHeader
          eyebrow="Client portal"
          title={`Welcome, ${customer.name || customer.email}`}
          description="View, manage, and access all your booked calls, products, memberships, and course lessons in one place."
        />
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1 text-xs">
            <User className="h-3 w-3 mr-1" /> Customer Account
          </Badge>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${s.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-black font-mono leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Upcoming bookings snapshot */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-md font-black">My Booked Sessions</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/bookings">View all <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.length > 0 ? (
              bookings.slice(0, 2).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-200/60 p-3.5 hover:bg-slate-50 transition">
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{(b.offers as any)?.title || "Booking Session"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(b.start_at).toLocaleString()} ({b.timezone})
                    </p>
                  </div>
                  <Badge variant={b.status === "confirmed" ? "success" : "warning"}>{b.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-xs italic text-muted-foreground py-4">No strategy sessions booked yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Digital Products snapshot */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-md font-black">Digital Purchases</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/products">View all <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length > 0 ? (
              orders.slice(0, 2).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-slate-200/60 p-3.5 hover:bg-slate-50 transition">
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{(o.offers as any)?.title || "Digital Product"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Price paid: {new Intl.NumberFormat("en", { style: "currency", currency: o.currency }).format(o.amount_cents / 100)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Paid
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs italic text-muted-foreground py-4">No digital templates or products purchased yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
