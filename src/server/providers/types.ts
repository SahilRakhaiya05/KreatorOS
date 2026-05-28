export type ProviderState = "not_configured" | "sandbox" | "mock_mode" | "connected" | "needs_reauth" | "error" | "disabled";

export type ConnectionResult = {
  status: ProviderState;
  url?: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

export type ActionResult = {
  ok: boolean;
  providerActionId?: string;
  message?: string;
  data?: Record<string, unknown>;
};

export type IntegrationProvider = {
  id: string;
  name: string;
  authType: "oauth" | "api_key" | "webhook" | "none";
  capabilities: string[];
  connect(input: Record<string, unknown>): Promise<ConnectionResult>;
  execute(action: string, payload: Record<string, unknown>): Promise<ActionResult>;
};
