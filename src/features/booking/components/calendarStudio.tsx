"use client";

import { useState } from "react";
import { bookings } from "@/shared/mock/data";
import { Badge, Card, cn } from "@/components/ui";
import { Calendar, CheckCircle2, Clock, CreditCard, MessageCircle, Route, Settings, Sparkles, Video } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const slots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

export function CalendarStudio() {
  const [selectedType, setSelectedType] = useState(bookings[0]);
  const [selectedSlot, setSelectedSlot] = useState("Tue 10:30");
  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr_360px]">
      <Card className="p-5">
        <p className="mb-4 font-black text-slate-950">Event types</p>
        <div className="space-y-3">
          {bookings.map(item => <button key={item.title} onClick={() => setSelectedType(item)} className={cn("w-full rounded-2xl border p-4 text-left transition", selectedType.title === item.title ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-slate-50 hover:bg-white")}><div className="flex items-center justify-between"><p className="font-black text-slate-950">{item.title}</p><Badge tone={item.type === "Paid" ? "green" : item.type === "Qualified" ? "violet" : "blue"}>{item.type}</Badge></div><p className="mt-2 text-sm text-slate-500">{item.duration} · {item.price} · {item.route}</p></button>)}
        </div>
        <div className="mt-5 rounded-2xl bg-lavender p-4"><p className="flex items-center gap-2 text-sm font-black text-violet-900"><Route className="h-4 w-4" /> Routing logic</p><p className="mt-2 text-sm leading-6 text-violet-800">Ask budget, goal, timezone, buyer type, and membership status before showing the right calendar.</p></div>
      </Card>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-5"><div><p className="font-black text-slate-950">Availability grid</p><p className="text-sm text-slate-500">Calendly/Cal.com-style scheduler with paid/free/gated routing.</p></div><Badge tone="green">Calendar synced</Badge></div>
        <div className="grid grid-cols-7 gap-px bg-slate-200 p-px">
          {days.map(day => <div key={day} className="bg-slate-50 p-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">{day}</div>)}
          {days.map(day => slots.map(slot => {
            const label = `${day} ${slot}`;
            const booked = ["Mon 14:00", "Wed 12:00", "Fri 10:30"].includes(label);
            return <button key={label} onClick={() => !booked && setSelectedSlot(label)} className={cn("min-h-24 bg-white p-3 text-left text-xs transition hover:bg-violet-50", selectedSlot === label && "bg-violet-50 ring-2 ring-inset ring-violet-300", booked && "bg-slate-100 text-slate-400")}><p className="font-black">{slot}</p><p className="mt-2">{booked ? "Booked" : selectedSlot === label ? "Selected" : "Open"}</p></button>
          }))}
        </div>
      </Card>
      <Card className="p-5">
        <p className="font-black text-slate-950">Booking automation</p>
        <p className="mt-1 text-sm text-slate-500">Selected: {selectedType.title} · {selectedSlot}</p>
        <div className="mt-5 space-y-3">
          {[
            [CreditCard, "Payment rule", selectedType.price === "Free" ? "No payment required" : `Collect ${selectedType.price} before confirmation`],
            [Calendar, "Calendar event", "Create event and block availability"],
            [Video, "Meeting link", "Generate Meet/Zoom link"],
            [MessageCircle, "Messages", "Email + WhatsApp confirmation and reminder"],
            [Sparkles, "AI follow-up", "Draft recap, offer, and next step"],
          ].map(([Icon, title, text]) => <div key={String(title)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex gap-3"><div className="rounded-xl bg-white p-2 text-violet-600 ring-1 ring-slate-200"><Icon className="h-4 w-4" /></div><div><p className="text-sm font-black text-slate-950">{String(title)}</p><p className="text-xs leading-5 text-slate-500">{String(text)}</p></div></div></div>)}
        </div>
      </Card>
    </div>
  );
}
