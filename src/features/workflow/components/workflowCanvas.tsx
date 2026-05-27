"use client";

import { useState } from "react";
import { workflowNodes } from "@/shared/mock/data";
import { Badge, Card, cn } from "@/components/ui";
import { Bell, Bot, Calendar, CreditCard, MessageCircle, MousePointerClick, Plus, Save, Settings, Trash2, Workflow } from "lucide-react";

const templates = [
  "Paid booking autopilot",
  "Brand inquiry to proposal",
  "Product purchase to upsell",
  "Member inactivity rescue",
  "Research interview loop",
  "Refund/support escalation"
];

export function WorkflowCanvas() {
  const [selected, setSelected] = useState(workflowNodes[1]);
  const [nodes, setNodes] = useState(workflowNodes);
  function addNode() {
    const id = `node_${nodes.length + 1}`;
    const node = { id, type: "AI Action", title: "New AI action", meta: "Configure tool + approval", tone: "bg-white" };
    setNodes([...nodes, node]);
    setSelected(node);
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr_340px]">
      <Card className="p-5">
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Workflow templates</p>
        <div className="space-y-2">
          {templates.map((item) => <button key={item} className="w-full rounded-2xl bg-slate-50 px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-100">{item}</button>)}
        </div>
        <button onClick={addNode} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" /> Add node</button>
      </Card>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <div><p className="font-black text-slate-950">Visual Automation Canvas</p><p className="text-sm text-slate-500">Drag-style blueprint: trigger → AI decision → action → approval → execution</p></div>
          <div className="flex gap-2"><Badge tone="green">Live draft</Badge><button className="rounded-xl bg-slate-950 p-2 text-white"><Save className="h-4 w-4" /></button></div>
        </div>
        <div className="workflow-canvas min-h-[560px] overflow-auto p-8">
          <div className="flex min-w-[1080px] items-center gap-10">
            {nodes.map((node, index) => (
              <button key={node.id} onClick={() => setSelected(node)} className={cn("react-like-node w-48 rounded-[1.5rem] border border-slate-200 p-4 text-left shadow-card transition hover:-translate-y-1", node.tone, selected.id === node.id && "ring-4 ring-violet-200")}> 
                <Badge tone={node.type.includes("AI") ? "violet" : index === 0 ? "blue" : "slate"}>{node.type}</Badge>
                <p className="mt-4 text-sm font-black text-slate-950">{node.title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{node.meta}</p>
              </button>
            ))}
          </div>
          <div className="mt-10 grid max-w-4xl gap-3 md:grid-cols-4">
            {[MousePointerClick, Calendar, CreditCard, MessageCircle].map((Icon, i) => <div key={i} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><Icon className="mb-3 h-5 w-5 text-violet-600" /><p className="text-sm font-bold">{["Trigger", "Schedule", "Payment", "Notify"][i]}</p></div>)}
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between"><p className="font-black text-slate-950">Node settings</p><Settings className="h-5 w-5 text-slate-400" /></div>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Node name</label>
        <input value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">Tool</label>
        <select className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
          <option>create_booking</option>
          <option>send_whatsapp_template</option>
          <option>create_checkout_session</option>
          <option>draft_brand_proposal</option>
          <option>summarize_interview</option>
        </select>
        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500">Approval policy</label>
        <div className="mt-2 space-y-2">
          {["Auto-run low risk", "Require creator approval", "Require brand + creator approval", "Admin only"].map(item => <label key={item} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-semibold"><input type="radio" name="policy" defaultChecked={item.includes("creator")} />{item}</label>)}
        </div>
        <div className="mt-5 rounded-2xl bg-violet-50 p-4 text-sm leading-6 text-violet-900"><Bot className="mb-2 h-5 w-5" />AI can suggest nodes, but execution is guarded by permissions, payment state, provider policy, and audit logs.</div>
      </Card>
    </div>
  );
}
