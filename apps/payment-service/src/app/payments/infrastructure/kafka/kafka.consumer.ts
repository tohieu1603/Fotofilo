import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { PaymentService } from '../../application/services/payment.service';
import { PaymentMethod } from '../../domain/entities/payment.entity';

@Injectable()
export class KafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentService: PaymentService,
  ) {
    this.kafka = new Kafka({
      clientId: 'payment-service',
      brokers: this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
    });

    this.consumer = this.kafka.consumer({
      groupId: 'payment-service-group',
    });
  }

  async onModuleInit() {
    await this.consumer.connect();
    this.logger.log('Kafka consumer connected');

    await this.consumer.subscribe({
      topic: 'order.created',
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    this.logger.log('Kafka consumer subscribed to order.created');
  }

  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;

    try {
      const value = message.value?.toString();
      if (!value) {
        this.logger.warn('Received empty message');
        return;
      }

      const data = JSON.parse(value);

      this.logger.log(`Received message from topic ${topic}: ${data.orderId}`);

      if (topic === 'order.created') {
        await this.handleOrderCreated(data);
      }
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
    }
  }

  private async handleOrderCreated(data: any) {
    this.logger.log(`Processing order.created event for order ${data.orderId}`);

    const paymentMethodMap: Record<string, PaymentMethod> = {
      COD: PaymentMethod.COD,
      MOMO: PaymentMethod.MOMO,
      VNPAY: PaymentMethod.VNPAY,
      STRIPE: PaymentMethod.STRIPE,
    };

    const paymentMethod = paymentMethodMap[data.paymentMethod] || PaymentMethod.COD;

    await this.paymentService.createPayment({
      orderId: data.orderId,
      customerId: data.customerId,
      amount: data.totalAmount,
      currency: data.currency || 'VND',
      paymentMethod,
      orderInfo: `Payment for order ${data.orderNumber || data.orderId}`,
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    this.logger.log('Kafka consumer disconnected');
  }
}
