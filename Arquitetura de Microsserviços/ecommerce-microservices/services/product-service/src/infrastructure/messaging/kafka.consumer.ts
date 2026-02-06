import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ReserveInventoryUseCase } from '../../application/use-cases/reserve-inventory/reserve-inventory.use-case';
import { ReleaseInventoryUseCase } from '../../application/use-cases/release-inventory/release-inventory.use-case';
import { env } from '../config/environment.config';

const ORDER_PROCESSED_TTL = 86400; // 24h idempotency

export interface IIdempotencyStore {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<void>;
}

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(
    private readonly reserveInventoryUseCase: ReserveInventoryUseCase,
    private readonly releaseInventoryUseCase: ReleaseInventoryUseCase,
    private readonly idempotencyStore: IIdempotencyStore
  ) {
    const kafka = new Kafka({
      clientId: 'product-service',
      brokers: env.kafka.brokers(),
    });
    this.consumer = kafka.consumer({ groupId: env.kafka.groupId() });
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'order-events', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    this.logger.log('Kafka consumer started for order-events');
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect();
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;
    let event: { eventType?: string; data?: unknown; metadata?: { correlationId?: string } };
    try {
      event = JSON.parse(message.value?.toString() ?? '{}');
    } catch {
      this.logger.warn('Invalid JSON in order-events message');
      return;
    }

    const eventType = event.eventType;
    const correlationId = event.metadata?.correlationId ?? '';

    this.logger.log(`Received event: ${eventType}`, { correlationId });

    try {
      if (eventType === 'OrderPlaced') {
        await this.handleOrderPlaced(event as { data: { orderId: string; items: Array<{ productId: string; quantity: number }> }; metadata?: { correlationId: string } });
      } else if (eventType === 'OrderCancelled') {
        await this.handleOrderCancelled(event as { data: { orderId: string; items?: Array<{ productId: string; quantity: number }> }; metadata?: { correlationId: string } });
      } else {
        this.logger.debug(`Unhandled event type: ${eventType}`);
      }
    } catch (err) {
      this.logger.error(
        `Error handling event: ${err instanceof Error ? err.message : String(err)}`,
        { correlationId }
      );
    }
  }

  private async handleOrderPlaced(event: {
    data: { orderId: string; items: Array<{ productId: string; quantity: number }> };
    metadata?: { correlationId: string };
  }): Promise<void> {
    const { orderId, items } = event.data;
    const correlationId = event.metadata?.correlationId ?? '';

    const idempotencyKey = `order-placed:${orderId}`;
    const processed = await this.idempotencyStore.get(idempotencyKey);
    if (processed) {
      this.logger.debug(`Order ${orderId} already processed (idempotent skip)`);
      return;
    }

    for (const item of items) {
      const result = await this.reserveInventoryUseCase.execute({
        productId: item.productId,
        quantity: item.quantity,
        orderId,
        correlationId,
      });

      if (result.isFailure) {
        this.logger.error(`Failed to reserve inventory: ${result.error}`, {
          orderId,
          productId: item.productId,
          correlationId,
        });
        throw new Error(result.error);
      }
    }

    await this.idempotencyStore.setex(idempotencyKey, ORDER_PROCESSED_TTL, 'true');
  }

  private async handleOrderCancelled(event: {
    data: { orderId: string; items?: Array<{ productId: string; quantity: number }> };
    metadata?: { correlationId: string };
  }): Promise<void> {
    const { orderId, items } = event.data;
    const correlationId = event.metadata?.correlationId ?? '';

    if (!items || items.length === 0) {
      this.logger.debug(`OrderCancelled ${orderId} has no items`);
      return;
    }

    for (const item of items) {
      const result = await this.releaseInventoryUseCase.execute({
        productId: item.productId,
        quantity: item.quantity,
        orderId,
        correlationId,
      });

      if (result.isFailure) {
        this.logger.warn(`Failed to release inventory: ${result.error}`, {
          orderId,
          productId: item.productId,
          correlationId,
        });
      }
    }
  }
}
