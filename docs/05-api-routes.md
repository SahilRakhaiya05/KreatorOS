# API route plan

## Auth and workspaces

Method | Route | Purpose
--- | --- | ---
POST | /api/auth/role-select | Set default user role after signup
GET | /api/workspaces | List user workspaces
POST | /api/workspaces | Create creator/brand workspace
GET | /api/me | Current user + roles + permissions

## AI agent

Method | Route | Purpose
--- | --- | ---
POST | /api/agent | Main AI operator planning endpoint
POST | /api/agent/tools/execute | Execute approved tool calls
GET | /api/agent/runs | List agent runs
GET | /api/agent/runs/:id | Inspect tool calls, outputs, approvals
POST | /api/agent/approvals/:id/approve | Approve pending action
POST | /api/agent/approvals/:id/reject | Reject action

## Creator page

Method | Route | Purpose
--- | --- | ---
GET | /api/pages/:slug | Public page data
POST | /api/pages | Create page
PATCH | /api/pages/:id | Update page settings/theme
POST | /api/pages/:id/blocks | Create page block
PATCH | /api/blocks/:id | Update block
POST | /api/blocks/reorder | Reorder blocks
POST | /api/pages/:id/publish | Publish page

## Store and products

Method | Route | Purpose
--- | --- | ---
GET | /api/products | Creator products
POST | /api/products | Create product
POST | /api/products/:id/upload | Upload product file
POST | /api/products/:id/checkout | Create checkout session
POST | /api/products/:id/bundle | Create bundle/upsell

## Calendar and booking

Method | Route | Purpose
--- | --- | ---
GET | /api/calendar/availability | Available slots
POST | /api/bookings | Hold slot and create booking
POST | /api/bookings/:id/confirm | Confirm booking after payment
POST | /api/bookings/:id/reschedule | Reschedule booking
POST | /api/bookings/:id/cancel | Cancel booking
POST | /api/routing-forms | Create routing form
POST | /api/routing-forms/submit | Evaluate route and return event types

## Workflow automation

Method | Route | Purpose
--- | --- | ---
GET | /api/workflows | List workflows
POST | /api/workflows | Create workflow
PATCH | /api/workflows/:id | Update workflow graph
POST | /api/workflows/:id/simulate | Test with sample event
POST | /api/workflows/:id/publish | Activate workflow
POST | /api/workflow-events | Emit event into workflow runner
GET | /api/workflow-runs/:id | Inspect execution log

## Brand portal

Method | Route | Purpose
--- | --- | ---
GET | /api/brand/creators/search | Creator discovery
POST | /api/brand/campaigns | Create campaign brief
POST | /api/brand/campaigns/:id/invite | Invite creator
GET | /api/collab-rooms/:id | Shared room data
POST | /api/collab-rooms/:id/messages | Send message
POST | /api/deliverables/:id/approve | Approve deliverable
POST | /api/brand/payments/escrow | Create escrow/hold payment

## Research lab

Method | Route | Purpose
--- | --- | ---
POST | /api/research/studies | Create research project
POST | /api/research/participants/import | Import CSV/customers
POST | /api/research/outreach/send | Send participant invitations
POST | /api/research/interviews/schedule | Schedule AI interview
POST | /api/research/interviews/:id/transcript | Save transcript
POST | /api/research/interviews/:id/summarize | Generate themes, quotes, recommendations

## Provider webhooks

Method | Route | Purpose
--- | --- | ---
POST | /api/payments/webhook | Stripe/Razorpay/Paddle events
POST | /api/providers/calcom/webhook | Cal.com booking events
POST | /api/providers/calendly/webhook | Calendly booking events
POST | /api/providers/zoom/webhook | Meeting recording/transcript events
POST | /api/providers/whatsapp/status | Delivery/read status
POST | /api/providers/email/webhook | Delivery/bounce/open events
