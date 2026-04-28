export interface IEventPublisher {
  publish(topic: string, event: Record<string, unknown>): Promise<void>;
}
