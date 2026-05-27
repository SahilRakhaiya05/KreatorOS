# Workflow engine

## Core concept

Every workflow is made of nodes.

- Trigger node: event starts the workflow.
- Condition node: route based on data.
- AI decision node: classify, summarize, or draft.
- Action node: mutate app/provider state.
- Approval node: require user or admin consent.
- Delay node: wait minutes/hours/days.
- Webhook node: send or receive provider events.
- End node: complete, fail, retry, or escalate.

## Trigger examples

- page.viewed
- block.clicked
- routing_form.submitted
- booking.created
- booking.cancelled
- payment.succeeded
- product.purchased
- membership.started
- member.inactive
- brand_inquiry.created
- deliverable.uploaded
- research_interview.completed
- support_message.received

## Action examples

- create_checkout_session
- create_calendar_event
- send_email
- send_whatsapp_template
- create_zoom_meeting
- unlock_product_access
- create_customer_tag
- draft_follow_up
- update_page_block
- create_brand_proposal
- request_approval
- generate_campaign_report

## Reliability requirements

- Idempotency keys on every provider action.
- Retry policy with exponential backoff.
- Dead-letter queue for failed provider calls.
- Audit logs for all AI/provider mutations.
- Workflow versioning.
- Test mode and simulation mode.
- Human approval for risky nodes.

## Node canvas UX

Left panel:
- Templates
- Trigger library
- Action library
- Agent tools

Center:
- Visual graph canvas
- Drag nodes
- Connect edges
- Simulate event path

Right panel:
- Node settings
- Conditions
- Tool parameters
- Approval policy
- Test input
- Execution logs
