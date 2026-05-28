"use client";

import { useState, useEffect } from "react";
import { workflowNodes } from "@/shared/mock/data";
import { Badge, Card, cn } from "@/components/ui";
import { 
  Bell, Bot, Calendar, CreditCard, MessageCircle, MousePointerClick, 
  Plus, Save, Settings, Trash2, Workflow, Loader2, Sparkles, AlertCircle 
} from "lucide-react";

const templates = [
  "Paid booking autopilot",
  "Brand inquiry to proposal",
  "Product purchase to upsell",
  "Member inactivity rescue",
  "Research interview loop",
  "Refund/support escalation"
];

const toneClasses: Record<string, string> = {
  "bg-lavender": "bg-violet-50 border-violet-200 text-violet-800",
  "bg-mint": "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-aqua": "bg-sky-50 border-sky-200 text-sky-800",
  "bg-lemon": "bg-amber-50 border-amber-200 text-amber-800",
  "bg-coral": "bg-rose-50 border-rose-200 text-rose-800",
  "bg-white": "bg-white border-slate-200 text-slate-800",
};

const templateData: Record<string, { trigger: string; nodes: any[] }> = {
  "Paid booking autopilot": {
    trigger: "booking.created",
    nodes: [
      { id: "t1", type: "Trigger", title: "Paid booking created", meta: "booking.created", tone: "bg-lavender", policy: "Auto-run low risk" },
      { id: "t2", type: "AI Decision", title: "Route high budget leads", meta: "pricing_test", tone: "bg-mint", policy: "Auto-run low risk" },
      { id: "t3", type: "Action", title: "Collect Stripe deposit", meta: "create_checkout_session", tone: "bg-lemon", policy: "Require creator approval" },
      { id: "t4", type: "Action", title: "Sync Google Calendar", meta: "create_booking", tone: "bg-aqua", policy: "Auto-run low risk" },
      { id: "t5", type: "Notify", title: "WhatsApp confirmation", meta: "send_whatsapp_template", tone: "bg-coral", policy: "Auto-run low risk" }
    ]
  },
  "Brand inquiry to proposal": {
    trigger: "brand.inquiry",
    nodes: [
      { id: "b1", type: "Trigger", title: "Brand inquiry submitted", meta: "brand.inquiry", tone: "bg-lavender", policy: "Auto-run low risk" },
      { id: "b2", type: "AI Decision", title: "Verify company budget", meta: "check_availability", tone: "bg-mint", policy: "Auto-run low risk" },
      { id: "b3", type: "AI Action", title: "Draft brand proposal", meta: "draft_brand_proposal", tone: "bg-white", policy: "Require creator approval" },
      { id: "b4", type: "Action", title: "Notify slack channel", meta: "send_whatsapp_template", tone: "bg-coral", policy: "Auto-run low risk" }
    ]
  },
  "Product purchase to upsell": {
    trigger: "order.paid",
    nodes: [
      { id: "p1", type: "Trigger", title: "Product purchase successful", meta: "order.paid", tone: "bg-lavender", policy: "Auto-run low risk" },
      { id: "p2", type: "AI Action", title: "Personalize upsell offer", meta: "pricing_test", tone: "bg-white", policy: "Require creator approval" },
      { id: "p3", type: "Action", title: "Create checkout link", meta: "create_checkout_session", tone: "bg-lemon", policy: "Auto-run low risk" },
      { id: "p4", type: "Notify", title: "Send custom email invitation", meta: "send_whatsapp_template", tone: "bg-coral", policy: "Auto-run low risk" }
    ]
  },
  "Member inactivity rescue": {
    trigger: "member.inactive",
    nodes: [
      { id: "m1", type: "Trigger", title: "Member inactive 14 days", meta: "member.inactive", tone: "bg-lavender", policy: "Auto-run low risk" },
      { id: "m2", type: "AI Decision", title: "Analyze engagement history", meta: "pricing_test", tone: "bg-mint", policy: "Auto-run low risk" },
      { id: "m3", type: "AI Action", title: "Write check-in template", meta: "draft_brand_proposal", tone: "bg-white", policy: "Require creator approval" },
      { id: "m4", type: "Notify", title: "Send email rescue", meta: "send_whatsapp_template", tone: "bg-coral", policy: "Auto-run low risk" }
    ]
  },
  "Research interview loop": {
    trigger: "interview.completed",
    nodes: [
      { id: "r1", type: "Trigger", title: "Interview recording ready", meta: "interview.completed", tone: "bg-lavender", policy: "Auto-run low risk" },
      { id: "r2", type: "Action", title: "Transcribe interview", meta: "summarize_interview", tone: "bg-aqua", policy: "Auto-run low risk" },
      { id: "r3", type: "AI Decision", title: "Extract key pain points", meta: "pricing_test", tone: "bg-mint", policy: "Auto-run low risk" },
      { id: "r4", type: "Action", title: "Save tags to profile", meta: "create_booking", tone: "bg-coral", policy: "Require creator approval" }
    ]
  },
  "Refund/support escalation": {
    trigger: "support.ticket",
    nodes: [
      { id: "s1", type: "Trigger", title: "Negative feedback ticket", meta: "support.ticket", tone: "bg-lavender", policy: "Auto-run low risk" },
      { id: "s2", type: "AI Decision", title: "Assess refund eligibility", meta: "pricing_test", tone: "bg-mint", policy: "Auto-run low risk" },
      { id: "s3", type: "AI Action", title: "Draft compensation credit", meta: "draft_brand_proposal", tone: "bg-white", policy: "Require creator approval" },
      { id: "s4", type: "Action", title: "Escalate to admin inbox", meta: "send_whatsapp_template", tone: "bg-coral", policy: "Require brand + creator approval" }
    ]
  }
};

const defaultAvailableTools = [
  "create_booking",
  "send_whatsapp_template",
  "create_checkout_session",
  "draft_brand_proposal",
  "summarize_interview",
  "pricing_test",
  "check_availability"
];

export function WorkflowCanvas() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("Paid booking autopilot");
  const [triggerEvent, setTriggerEvent] = useState("booking.created");
  const [status, setStatus] = useState<"draft" | "active" | "paused" | "archived">("draft");
  const [nodes, setNodes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Fetch saved workflows
  async function fetchWorkflows() {
    try {
      const res = await fetch("/api/workflows");
      const json = await res.json();
      if (json.ok) {
        setWorkflows(json.workflows || []);
        if (json.workflows && json.workflows.length > 0) {
          loadWorkflow(json.workflows[0]);
        } else {
          // Initialize with default template
          loadTemplate("Paid booking autopilot");
        }
      }
    } catch (err) {
      showToast("Error loading workflows from database", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkflows();
  }, []);

  function loadWorkflow(wf: any) {
    setCurrentWorkflowId(wf.id);
    setWorkflowName(wf.name);
    setTriggerEvent(wf.trigger_event || "booking.created");
    setStatus(wf.status || "draft");
    const parsedNodes = wf.graph?.nodes || [];
    setNodes(parsedNodes);
    if (parsedNodes.length > 0) {
      setSelected(parsedNodes[0]);
    } else {
      setSelected(null);
    }
  }

  function loadTemplate(templateName: string) {
    const data = templateData[templateName] || templateData["Paid booking autopilot"];
    setCurrentWorkflowId(null);
    setWorkflowName(templateName);
    setTriggerEvent(data.trigger);
    setStatus("draft");
    
    // Deep clone nodes
    const templateNodes = JSON.parse(JSON.stringify(data.nodes));
    setNodes(templateNodes);
    if (templateNodes.length > 0) {
      setSelected(templateNodes[0]);
    } else {
      setSelected(null);
    }
    showToast(`Loaded "${templateName}" template`);
  }

  function createCustomWorkflow() {
    setCurrentWorkflowId(null);
    setWorkflowName("New Custom Automation");
    setTriggerEvent("page.viewed");
    setStatus("draft");
    
    const initialNodes = [
      { id: "node_1", type: "Trigger", title: "User visits page", meta: "page.viewed", tone: "bg-lavender", policy: "Auto-run low risk" }
    ];
    setNodes(initialNodes);
    setSelected(initialNodes[0]);
    showToast("Created a new custom workflow draft");
  }

  function addNode() {
    const id = `node_${Date.now()}`;
    const node = { 
      id, 
      type: "AI Action", 
      title: "New automation step", 
      meta: "pricing_test", 
      tone: "bg-white", 
      policy: "Require creator approval" 
    };
    setNodes([...nodes, node]);
    setSelected(node);
    showToast("Added new node step");
  }

  function deleteNode(id: string) {
    const remaining = nodes.filter(n => n.id !== id);
    setNodes(remaining);
    if (remaining.length > 0) {
      setSelected(remaining[0]);
    } else {
      setSelected(null);
    }
    showToast("Deleted node");
  }

  const updateSelectedNode = (updatedFields: Partial<any>) => {
    if (!selected) return;
    const updatedNode = { ...selected, ...updatedFields };
    setSelected(updatedNode);
    setNodes(nodes.map(n => n.id === selected.id ? updatedNode : n));
  };

  async function saveWorkflow() {
    if (!workflowName.trim()) {
      showToast("Workflow name cannot be empty", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentWorkflowId || undefined,
          name: workflowName,
          trigger: triggerEvent,
          status: status,
          nodes: nodes,
          edges: []
        })
      });
      const json = await res.json();
      if (json.ok) {
        showToast(currentWorkflowId ? "Workflow changes saved!" : "Workflow created successfully!");
        if (json.workflow?.id) {
          setCurrentWorkflowId(json.workflow.id);
        }
        // Refresh workflow list
        const listRes = await fetch("/api/workflows");
        const listJson = await listRes.json();
        if (listJson.ok) {
          setWorkflows(listJson.workflows || []);
        }
      } else {
        showToast(json.error || "Failed to save workflow", "error");
      }
    } catch (err) {
      showToast("Network error when saving workflow", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkflow(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      const res = await fetch(`/api/workflows?id=${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.ok) {
        showToast("Workflow deleted");
        if (currentWorkflowId === id) {
          const remaining = workflows.filter(w => w.id !== id);
          if (remaining.length > 0) {
            loadWorkflow(remaining[0]);
          } else {
            loadTemplate("Paid booking autopilot");
          }
        }
        setWorkflows(workflows.filter(w => w.id !== id));
      } else {
        showToast(json.error || "Failed to delete workflow", "error");
      }
    } catch (err) {
      showToast("Network error when deleting workflow", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
        <span className="ml-2 font-bold text-slate-700">Loading Automation Workflows...</span>
      </div>
    );
  }

  return (
    <div className="relative grid gap-6 xl:grid-cols-[300px_1fr_340px]">
      
      {/* Toast Alert */}
      {toast && (
        <div className={cn(
          "fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-lg transition-all animate-bounce",
          toast.type === "success" ? "bg-emerald-800 text-white" : "bg-rose-800 text-white"
        )}>
          {toast.type === "success" ? <Sparkles className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Left panel: saved list + templates */}
      <Card className="p-5 flex flex-col gap-6">
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">My Workflows</p>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {workflows.length === 0 ? (
              <p className="text-xs italic text-slate-400 p-2">No workflows saved yet.</p>
            ) : (
              workflows.map((wf) => (
                <div 
                  key={wf.id}
                  onClick={() => loadWorkflow(wf)}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition cursor-pointer hover:bg-slate-100",
                    currentWorkflowId === wf.id ? "bg-slate-100 ring-1 ring-slate-200" : "bg-transparent"
                  )}
                >
                  <div className="flex flex-col gap-0.5 truncate">
                    <span className="text-slate-800 truncate font-black">{wf.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{wf.trigger_event}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] uppercase px-1.5 py-0.5 rounded font-black",
                      wf.status === "active" ? "bg-emerald-100 text-emerald-800" : 
                      wf.status === "paused" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                    )}>
                      {wf.status}
                    </span>
                    <button 
                      onClick={(e) => deleteWorkflow(wf.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 transition"
                      title="Delete workflow"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={createCustomWorkflow}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Plus className="h-3.5 w-3.5" /> New custom workflow
          </button>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Blueprint templates</p>
          <div className="space-y-1.5">
            {templates.map((item) => (
              <button 
                key={item} 
                onClick={() => loadTemplate(item)}
                className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 transition truncate hover:translate-x-1"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Center panel: visual canvas */}
      <Card className="overflow-hidden flex flex-col">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Workflow className="h-5 w-5 text-violet-600 animate-pulse" />
              <input 
                value={workflowName} 
                onChange={(e) => setWorkflowName(e.target.value)} 
                className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-violet-600 focus:outline-none text-lg font-black text-slate-950 w-full max-w-xs md:max-w-md transition"
                placeholder="Workflow name..."
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Active Trigger Event: <strong className="text-slate-600">{triggerEvent}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Trigger</label>
              <select 
                value={triggerEvent} 
                onChange={(e) => setTriggerEvent(e.target.value)} 
                className="rounded-xl border border-slate-200 px-2 py-1 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="booking.created">booking.created</option>
                <option value="brand.inquiry">brand.inquiry</option>
                <option value="order.paid">order.paid</option>
                <option value="member.inactive">member.inactive</option>
                <option value="interview.completed">interview.completed</option>
                <option value="support.ticket">support.ticket</option>
                <option value="page.viewed">page.viewed</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)} 
                className="rounded-xl border border-slate-200 px-2 py-1 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <button 
              onClick={saveWorkflow}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-black text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {currentWorkflowId ? "Update" : "Save"}
            </button>
          </div>
        </div>

        <div className="workflow-canvas min-h-[480px] overflow-x-auto p-8 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center gap-8 py-4">
            {nodes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Workflow className="h-12 w-12 stroke-[1.5] text-slate-300 mb-2" />
                <p className="text-sm font-bold">No nodes in this blueprint.</p>
                <p className="text-xs">Click "Add step node" to begin building automation rules.</p>
              </div>
            ) : (
              nodes.map((node, index) => {
                const isSelected = selected?.id === node.id;
                const toneStyle = toneClasses[node.tone] || toneClasses["bg-white"];
                return (
                  <div key={node.id} className="relative flex items-center">
                    {/* Node connector line */}
                    {index > 0 && (
                      <div className="absolute -left-8 right-full h-0.5 bg-slate-200 w-8 z-0"></div>
                    )}
                    
                    <button 
                      onClick={() => setSelected(node)} 
                      className={cn(
                        "relative z-10 w-44 rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
                        toneStyle,
                        isSelected ? "ring-2 ring-violet-600 border-transparent scale-105" : ""
                      )}
                    > 
                      <Badge tone={
                        node.type.includes("AI") ? "violet" : 
                        index === 0 ? "blue" : 
                        node.type === "Trigger" ? "amber" : "slate"
                      }>
                        {node.type}
                      </Badge>
                      <p className="mt-3 text-xs font-black text-slate-900 line-clamp-1">{node.title}</p>
                      <p className="mt-1.5 text-[10px] font-semibold text-slate-500 truncate leading-relaxed">
                        {node.meta}
                      </p>
                    </button>
                  </div>
                );
              })
            )}
            
            <button 
              onClick={addNode}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-400 hover:border-violet-500 hover:text-violet-600 transition shadow-sm hover:scale-105"
              title="Add automation step"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="border-t border-slate-200/60 pt-6 mt-6">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Available events palette</p>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {[
                { label: "Trigger", desc: "booking.created, order.paid", Icon: MousePointerClick },
                { label: "AI Decision", desc: "Route via prompt evaluation", Icon: Bot },
                { label: "Action", desc: "Stripe, google calendar hooks", Icon: CreditCard },
                { label: "Notify", desc: "WhatsApp, transaction email", Icon: MessageCircle }
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100 hover:ring-slate-200 transition cursor-default">
                  <item.Icon className="mb-2 h-4 w-4 text-violet-600" />
                  <p className="text-xs font-black text-slate-800">{item.label}</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Right panel: settings */}
      <Card className="p-5">
        {selected ? (
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <p className="font-black text-sm text-slate-950">Step Configuration</p>
                <Settings className="h-4 w-4 text-slate-400" />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step Title</label>
                <input 
                  value={selected.title} 
                  onChange={(e) => updateSelectedNode({ title: e.target.value })} 
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step Type</label>
                <select 
                  value={selected.type} 
                  onChange={(e) => {
                    const newType = e.target.value;
                    let tone = "bg-white";
                    if (newType === "Trigger") tone = "bg-lavender";
                    else if (newType === "AI Decision") tone = "bg-mint";
                    else if (newType === "Action") tone = "bg-aqua";
                    else if (newType === "Notify") tone = "bg-coral";
                    
                    updateSelectedNode({ type: newType, tone });
                  }} 
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="Trigger">Trigger</option>
                  <option value="AI Decision">AI Decision</option>
                  <option value="Action">Action</option>
                  <option value="AI Action">AI Action</option>
                  <option value="Notify">Notify</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Integration Tool / Target</label>
                <select 
                  value={selected.meta} 
                  onChange={(e) => updateSelectedNode({ meta: e.target.value })} 
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {defaultAvailableTools.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="page.viewed">page.viewed</option>
                  <option value="booking.created">booking.created</option>
                  <option value="order.paid">order.paid</option>
                  <option value="member.inactive">member.inactive</option>
                  <option value="interview.completed">interview.completed</option>
                  <option value="support.ticket">support.ticket</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approval Policy</label>
                <div className="mt-2 space-y-1.5">
                  {[
                    "Auto-run low risk", 
                    "Require creator approval", 
                    "Require brand + creator approval", 
                    "Admin only"
                  ].map(item => (
                    <label 
                      key={item} 
                      className="flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition p-2.5 text-xs font-bold cursor-pointer text-slate-700"
                    >
                      <input 
                        type="radio" 
                        name="policy" 
                        checked={(selected.policy || "Require creator approval") === item} 
                        onChange={() => updateSelectedNode({ policy: item })}
                        className="text-violet-600 focus:ring-violet-500 h-3.5 w-3.5"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="rounded-xl bg-violet-50/50 border border-violet-100 p-3 text-[11px] leading-relaxed text-violet-800">
                <Bot className="mb-1.5 h-4 w-4 text-violet-600" />
                AI operator can auto-propose new canvas flows or update nodes based on dashboard objectives, subject to active approval policies.
              </div>
              
              <button 
                onClick={() => deleteNode(selected.id)} 
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete step node
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 p-4">
            <Settings className="h-8 w-8 text-slate-300 mb-2 animate-spin-slow" />
            <p className="text-xs font-bold">No step selected</p>
            <p className="text-[10px] mt-1">Select a card on the canvas layout to customize its tool configuration and triggers.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
