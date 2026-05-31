"use client";

import posthog from "posthog-js";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function captureClientEvent(event: string, properties: AnalyticsProperties = {}) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_TOKEN) return;
  posthog.capture(event, properties);
}

export const analyticsEvents = {
  authStarted: "auth.started",
  authSucceeded: "auth.succeeded",
  authFailed: "auth.failed",
  onboardingSubmitted: "onboarding.submitted",
  chatMessageSent: "chat.message_sent",
  chatResponseCompleted: "chat.response_completed",
  chatResponseFailed: "chat.response_failed",
  publicLinkClicked: "public_link.clicked",
  bookingCreated: "booking.created",
  bookingFailed: "booking.failed",
  checkoutStarted: "checkout.started",
  offerPurchased: "offer.purchased",
  operatorFullAccessToggled: "operator.full_access_toggled",
  operatorRunStarted: "operator.run_started",
  settingsUpdated: "settings.updated",

  // Marketing page events
  landingHeroCtaClicked: "landing.hero_cta_clicked",
  landingPricingIntervalToggled: "landing.pricing_interval_toggled",
  landingPricingCtaClicked: "landing.pricing_cta_clicked",
  landingEarlyAccessRequested: "landing.early_access_requested",
  landingFaqOpened: "landing.faq_opened",

  // Brand Discovery events
  brandDiscoverCreatorViewed: "brand_discover.creator_viewed",
  brandDiscoverCollabRoomClicked: "brand_discover.collab_room_clicked",

  // Brand Collab Room events
  collabRoomDealSelected: "collab_room.deal_selected",
  collabRoomPackageAccepted: "collab_room.package_accepted",
  collabRoomDeliverableApproved: "collab_room.deliverable_approved",
  collabRoomPrerequisiteOverridden: "collab_room.prerequisite_overridden",
  collabRoomChatModeToggled: "collab_room.chat_mode_toggled",
  collabRoomMessageSent: "collab_room.message_sent",

  // Bio Page Builder events
  pageBuilderProfileSaved: "page_builder.profile_saved",
  pageBuilderBlockAdded: "page_builder.block_added",
  pageBuilderBlockDeleted: "page_builder.block_deleted",
  pageBuilderVersionSaved: "page_builder.version_saved",
  pageBuilderVersionRestoreRequested: "page_builder.version_restore_requested",
  pageBuilderAiPolishTriggered: "page_builder.ai_polish_triggered",

  // Research Lab events
  researchLabStudyCreated: "research_lab.study_created",
  researchLabStudyLaunched: "research_lab.study_launched",
  researchLabStudySelected: "research_lab.study_selected",

  // Workflow Canvas / KOffice events
  kofficeWorkflowSaved: "koffice.workflow_saved",
  kofficeSandboxInitiated: "koffice.sandbox_initiated",
  kofficeSandboxRecycled: "koffice.sandbox_recycled",
  kofficeSandboxWindowChanged: "koffice.sandbox_window_changed",
  kofficeTerminalCommandExecuted: "koffice.terminal_command_executed",
};
