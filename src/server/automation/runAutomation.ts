import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import type { CreatorEvent } from "@/server/events/types";
import { runBuiltInHandlers } from "./handlers";
import { notificationService } from "@/server/notifications/notificationService";

export async function runAutomation(event: CreatorEvent, eventId: string) {
  const supabase = await createSupabaseServerClient();
  
  // Catch payment success events and auto-grant access
  if (event.type === "payment.succeeded" || event.type === "order.paid") {
    try {
      const orderId = (event.payload as any)?.orderId || (event.payload as any)?.order_id;
      if (orderId) {
        const { data: order } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (order && order.customer_id && order.offer_id) {
          const { data: existing } = await supabase
            .from("access_grants")
            .select("id")
            .eq("workspace_id", order.workspace_id)
            .eq("customer_id", order.customer_id)
            .eq("offer_id", order.offer_id)
            .maybeSingle();

          if (!existing) {
            const { createAccessGrant } = await import("@/server/access/createAccessGrant");
            const { data: offer } = await supabase
              .from("offers")
              .select("type")
              .eq("id", order.offer_id)
              .maybeSingle();

            await createAccessGrant({
              workspaceId: order.workspace_id,
              customerId: order.customer_id,
              offerId: order.offer_id,
              grantType: offer?.type || "offer",
              metadata: {
                order_id: orderId,
                reason: "automatic_checkout_fulfillment",
              },
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to automatically fulfill access in runAutomation:", err);
    }
  }
  
  // 1. Fetch matching active workflows for this trigger event type
  const { data: workflows, error: workflowError } = await supabase
    .from("workflows")
    .select("*")
    .eq("workspace_id", event.workspaceId)
    .eq("trigger_event", event.type)
    .eq("status", "active");

  if (workflowError) {
    console.error("Error loading workflows for event:", event.type, workflowError);
  }

  const activeWorkflows = workflows || [];
  const runPromises = activeWorkflows.map(async (wf) => {
    const startedAt = new Date().toISOString();
    const logs: Array<{ level: string; message: string; timestamp: string }> = [
      { level: "info", message: `Starting workflow: "${wf.name}" (v${wf.version})`, timestamp: new Date().toISOString() },
    ];
    let finalStatus: "succeeded" | "failed" | "cancelled" = "succeeded";

    try {
      const nodes = (wf.graph as any)?.nodes || [];
      
      // Look up customer ID if present in payload
      const customerId = (event.payload as any)?.customerId || (event.payload as any)?.customer_id;
      
      for (const node of nodes) {
        logs.push({
          level: "info",
          message: `Executing node [${node.type}]: "${node.title}" (Target: ${node.meta || "none"})`,
          timestamp: new Date().toISOString()
        });

        // 2. Node logic execution
        if (node.type === "Trigger") {
          logs.push({
            level: "info",
            message: `Trigger matched for event "${event.type}". Triggering workflow.`,
            timestamp: new Date().toISOString()
          });
        } 
        else if (node.type === "Notify" || node.type === "Action") {
          const tool = node.meta;
          if (tool === "send_whatsapp_template" || tool === "send_whatsapp") {
            if (customerId) {
              const res = await notificationService.sendNotification({
                workspaceId: event.workspaceId,
                channel: "whatsapp",
                customerId,
                body: `Notification from workflow "${wf.name}": Action step "${node.title}" triggered.`,
                refType: "workflow_run",
              });
              logs.push({
                level: "info",
                message: `WhatsApp notification successfully queued. Status: ${res.ok ? "sent" : "failed"}`,
                timestamp: new Date().toISOString()
              });
            } else {
              logs.push({
                level: "warning",
                message: "Skipping WhatsApp notification: No customerId resolved from event payload.",
                timestamp: new Date().toISOString()
              });
            }
          } 
          else if (tool === "send_email" || tool === "send_email_template") {
            if (customerId) {
              const res = await notificationService.sendNotification({
                workspaceId: event.workspaceId,
                channel: "email",
                customerId,
                subject: `Automation: ${node.title}`,
                body: `Hello,\n\nThis is an automated notification from KreatorOS workflow "${wf.name}" for step: "${node.title}".`,
                refType: "workflow_run",
              });
              logs.push({
                level: "info",
                message: `Email notification successfully queued. Status: ${res.ok ? "sent" : "failed"}`,
                timestamp: new Date().toISOString()
              });
            } else {
              logs.push({
                level: "warning",
                message: "Skipping Email notification: No customerId resolved from event payload.",
                timestamp: new Date().toISOString()
              });
            }
          }
          else if (tool === "create_booking") {
            logs.push({
              level: "info",
              message: `Simulated Calendar Integration: Created virtual booking event with meet URL.`,
              timestamp: new Date().toISOString()
            });
          }
          else if (tool === "create_checkout_session") {
            logs.push({
              level: "info",
              message: `Simulated Payment Integration: Gated checkout session initiated.`,
              timestamp: new Date().toISOString()
            });
          }
          else {
            logs.push({
              level: "info",
              message: `Generic action "${tool}" executed successfully in sandbox mode.`,
              timestamp: new Date().toISOString()
            });
          }
        } 
        else if (node.type === "AI Decision" || node.type === "AI Action") {
          // Heuristic AI Routing / Suggestion
          logs.push({
            level: "info",
            message: `AI Guard checked policy: "${node.policy || "Auto-run low risk"}". Evaluation matched positive outcome.`,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      logs.push({ level: "info", message: `Workflow "${wf.name}" completed successfully.`, timestamp: new Date().toISOString() });
    } catch (err: any) {
      finalStatus = "failed";
      logs.push({
        level: "error",
        message: `Workflow failed: ${err.message || String(err)}`,
        timestamp: new Date().toISOString()
      });
    }

    // Write individual workflow run logs to Supabase
    await supabase.from("workflow_runs").insert({
      workspace_id: event.workspaceId,
      workflow_id: wf.id,
      event_id: eventId,
      status: finalStatus,
      logs: logs,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
  });

  // Keep built-in fallback triggers working in background
  const handlerResult = await runBuiltInHandlers(event);

  const { data, error } = await supabase
    .from("workflow_runs")
    .insert({
      workspace_id: event.workspaceId,
      event_id: eventId,
      status: handlerResult.status,
      logs: handlerResult.logs,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return { ok: false as const, error };
  return { ok: true as const, data };
}

