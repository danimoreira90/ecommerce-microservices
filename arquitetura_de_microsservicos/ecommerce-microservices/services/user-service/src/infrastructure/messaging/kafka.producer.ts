import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { env } from '../config/environment.config';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private connected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'user-service',
      brokers: env.kafka.brokers(),
      connectionTimeout: 3000,
      requestTimeout: 5000,
      retry: { retries: 1 },
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect();
      this.connected = true;
      this.logger.log('Kafka producer conectado');
    } catch (err) {
      this.logger.warn(`Kafka indisponível — eventos não serão publicados. Erro: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect().catch(() => undefined);
    }
  }

  async publish(topic: string, payload: unknown): Promise<void> {
    if (!this.connected) {
      this.logger.warn(`Kafka desconectado — evento descartado: ${topic}`);
      return;
    }
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }
}
