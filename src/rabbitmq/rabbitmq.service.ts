import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, Channel, Connection } from 'amqplib';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    await this.ensureChannel();
  }

  async onModuleDestroy() {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async ensureChannel() {
    if (this.channel) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) {
      this.logger.warn('RABBITMQ_URL no configurado, eventos deshabilitados');
      return;
    }
    this.initPromise = (async () => {
      try {
        this.connection = await connect(url);
        this.channel = await this.connection.createChannel();
      } catch (error) {
        this.logger.error('No se pudo conectar a RabbitMQ', error as Error);
      } finally {
        this.initPromise = null;
      }
    })();
    await this.initPromise;
  }

  async publishEvent<T extends Record<string, unknown>>(params: {
    exchange: string;
    routingKey: string;
    type: string;
    data: T;
    producer: string;
    correlationId?: string;
  }) {
    await this.ensureChannel();
    if (!this.channel) return;
    await this.channel.assertExchange(params.exchange, 'topic', { durable: true });
    const payload = {
      id: randomUUID(),
      type: params.type,
      version: 1,
      occurredAt: new Date().toISOString(),
      producer: params.producer,
      correlationId: params.correlationId,
      data: params.data,
    };
    this.channel.publish(
      params.exchange,
      params.routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, contentType: 'application/json' },
    );
  }
}

