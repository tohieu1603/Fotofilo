import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import {
  PaymentSuccessEvent,
  PaymentFailedEvent,
  PaymentPendingEvent,
} from '../../application/events/payment.events';

@Injectable()
export class KafkaProducer implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducer.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'payment-service',
      brokers: this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async sendPaymentSuccessEvent(event: PaymentSuccessEvent): Promise<void> {
    try {
      await this.producer.send({
        topic: 'payment.success',
        messages: [
          {
            key: event.orderId,
            value: JSON.stringify({
              paymentId: event.paymentId,
              orderId: event.orderId,
              transactionId: event.transactionId,
              amount: event.amount,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      this.logger.log(`Payment success event sent for order ${event.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment success event: ${error.message}`);
      throw error;
    }
  }

  async sendPaymentFailedEvent(event: PaymentFailedEvent): Promise<void> {
    try {
      await this.producer.send({
        topic: 'payment.failed',
        messages: [
          {
            key: event.orderId,
            value: JSON.stringify({
              paymentId: event.paymentId,
              orderId: event.orderId,
              reason: event.reason,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      this.logger.log(`Payment failed event sent for order ${event.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment failed event: ${error.message}`);
      throw error;
    }
  }

  async sendPaymentPendingEvent(event: PaymentPendingEvent): Promise<void> {
    try {
      await this.producer.send({
        topic: 'payment.pending',
        messages: [
          {
            key: event.orderId,
            value: JSON.stringify({
              paymentId: event.paymentId,
              orderId: event.orderId,
              paymentUrl: event.paymentUrl,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      this.logger.log(`Payment pending event sent for order ${event.orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send payment pending event: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }
}
