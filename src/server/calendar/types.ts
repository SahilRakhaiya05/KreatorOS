export type CalendarEventInput = {
  workspaceId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, unknown>;
};

export type CalendarEventResult = {
  ok: boolean;
  externalEventId?: string;
  meetingUrl?: string;
  error?: string;
};

export type AvailabilityInput = {
  workspaceId: string;
  startTime: string;
  endTime: string;
};

export type TimeSlot = {
  start: string;
  end: string;
};

export interface CalendarProvider {
  createEvent(input: CalendarEventInput): Promise<CalendarEventResult>;
  getAvailability(input: AvailabilityInput): Promise<TimeSlot[]>;
}
