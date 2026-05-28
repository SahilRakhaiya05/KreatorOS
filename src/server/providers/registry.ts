import type { IntegrationProvider } from "./types";

function unavailableProvider(id: string, name: string, capabilities: string[]): IntegrationProvider {
  return {
    id,
    name,
    authType: "oauth",
    capabilities,
    async connect() {
      return { status: "not_configured", message: `${name} is not configured.` };
    },
    async execute() {
      return { ok: false, message: `${name} is not connected.` };
    },
  };
}

export const providerRegistry = {
  stripe: unavailableProvider("stripe", "Stripe", ["checkout", "subscriptions", "refunds"]),
  googleCalendar: unavailableProvider("google_calendar", "Google Calendar", ["events", "availability"]),
  calcom: unavailableProvider("calcom", "Cal.com", ["booking_webhooks"]),
  whatsapp: unavailableProvider("whatsapp", "WhatsApp Business", ["transactional_messages"]),
  email: unavailableProvider("email", "Email", ["transactional_email"]),
} as const;

export function getProvider(providerId: keyof typeof providerRegistry) {
  return providerRegistry[providerId];
}
