export type PublicAssistantOffer = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  price_cents: number;
  currency: string;
  slug: string;
};

export type AssistantReply = {
  message: string;
  recommendedOffers: PublicAssistantOffer[];
  leadCapturePrompt?: string;
  nextActions: Array<{
    label: string;
    type: "checkout" | "booking" | "lead" | "link";
    href?: string;
    offerId?: string;
  }>;
};
