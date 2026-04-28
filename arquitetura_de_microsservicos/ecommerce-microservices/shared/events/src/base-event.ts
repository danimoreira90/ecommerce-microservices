export interface EventMetadata {
  correlationId: string;
  causationId: string;
}

export interface BaseDomainEvent {
  eventId: string;
  timestamp: string;
  version: string;
  metadata: EventMetadata;
}
