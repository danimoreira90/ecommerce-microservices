import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { IEventPublisher } from '../../application/ports/event-publisher.interface';
import { env } from '../config/environment.config';

@Injectable()
export class KafkaProducerService implements IEventPublisher, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'product-service',
      brokers: env.kafka.brokers(),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(topic: string, event: Record<string, unknown>): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(event) }],
    });
  }
}
