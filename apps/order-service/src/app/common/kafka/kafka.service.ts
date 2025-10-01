import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.log('Kafka client connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka:', error);
      throw new Error(`Failed to connect to Kafka: ${error}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.kafkaClient.close();
      this.logger.log('Kafka client disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
    }
  }

  async send(topic: string, message: any): Promise<void> {
    try {
      await this.kafkaClient.emit(topic, message).toPromise();
      this.logger.log(`Message sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}:`, error);
      throw new Error(`Failed to send message to Kafka: ${error}`);
    }
  }

  async emit(pattern: string, data: any): Promise<void> {
    try {
      await this.kafkaClient.emit(pattern, data).toPromise();
      this.logger.log(`Message emitted with pattern ${pattern}`);
    } catch (error) {
      this.logger.error(`Failed to emit message with pattern ${pattern}:`, error);
      throw error;
    }
  }

  async sendOrderCreatedEvent(orderData: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    totalAmount: number;
    currency: string;
    status: string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
    }>;
    shippingAddress: any;
    createdAt: Date;
  }): Promise<void> {
    await this.emit('order.created', orderData);
  }

  async sendOrderStatusUpdatedEvent(orderData: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    oldStatus: string;
    newStatus: string;
    updatedAt: Date;
  }): Promise<void> {
    await this.emit('order.status.updated', orderData);
  }

  async sendOrderCancelledEvent(orderData: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    reason: string;
    cancelledAt: Date;
  }): Promise<void> {
    await this.emit('order.cancelled', orderData);
  }
}
