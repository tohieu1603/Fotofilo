import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentMethod, PaymentStatus } from '../../domain/entities/payment.entity';
import { MoMoProvider } from '../../infrastructure/providers/momo.provider';
import { KafkaProducer } from '../../infrastructure/kafka/kafka.producer';
import {
  PaymentSuccessEvent,
  PaymentFailedEvent,
  PaymentPendingEvent,
} from '../events/payment.events';

export interface CreatePaymentDto {
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  orderInfo?: string;
}

export interface PaymentCallbackDto {
  orderId: string;
  transactionId: string;
  resultCode: number;
  message: string;
  gatewayResponse: Record<string, any>;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly momoProvider: MoMoProvider,
    private readonly kafkaProducer: KafkaProducer,
    private readonly configService: ConfigService,
  ) {}

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    this.logger.log(`Creating payment for order ${dto.orderId} with method ${dto.paymentMethod}`);

    const payment = this.paymentRepository.create({
      orderId: dto.orderId,
      customerId: dto.customerId,
      amount: dto.amount.toString(),
      currency: dto.currency,
      paymentMethod: dto.paymentMethod,
      status: PaymentStatus.PENDING,
    });

    await this.paymentRepository.save(payment);

    // Handle different payment methods
    if (dto.paymentMethod === PaymentMethod.COD) {
      // COD - just mark as pending, will be updated on delivery
      await this.kafkaProducer.sendPaymentPendingEvent(
        new PaymentPendingEvent(payment.id, payment.orderId),
      );
    } else if (dto.paymentMethod === PaymentMethod.MOMO) {
      // MoMo - create payment URL
      const redirectUrl = this.configService.get<string>('PAYMENT_REDIRECT_URL') || 'http://localhost:3000/payment/result';
      const ipnUrl = this.configService.get<string>('PAYMENT_IPN_URL') || 'http://localhost:3001/payments/callback/momo';

      const momoResponse = await this.momoProvider.createPayment({
        orderId: payment.orderId,
        amount: dto.amount,
        orderInfo: dto.orderInfo || `Payment for order ${payment.orderId}`,
        redirectUrl,
        ipnUrl,
      });

      payment.paymentUrl = momoResponse.payUrl;
      payment.transactionId = momoResponse.requestId;
      payment.status = PaymentStatus.PROCESSING;
      await this.paymentRepository.save(payment);

      await this.kafkaProducer.sendPaymentPendingEvent(
        new PaymentPendingEvent(payment.id, payment.orderId, momoResponse.payUrl),
      );
    }

    return payment;
  }

  async handleMoMoCallback(callbackData: Record<string, any>): Promise<void> {
    this.logger.log(`Handling MoMo callback for order ${callbackData.orderId}`);

    // Verify signature
    if (!this.momoProvider.verifySignature(callbackData)) {
      this.logger.error('Invalid MoMo callback signature');
      throw new Error('Invalid signature');
    }

    const payment = await this.paymentRepository.findOne({
      where: { orderId: callbackData.orderId },
    });

    if (!payment) {
      this.logger.error(`Payment not found for order ${callbackData.orderId}`);
      throw new Error('Payment not found');
    }

    payment.gatewayResponse = callbackData;
    payment.transactionId = callbackData.transId || payment.transactionId;

    if (callbackData.resultCode === 0) {
      // Payment success
      payment.status = PaymentStatus.SUCCESS;
      payment.paidAt = new Date();
      await this.paymentRepository.save(payment);

      await this.kafkaProducer.sendPaymentSuccessEvent(
        new PaymentSuccessEvent(
          payment.id,
          payment.orderId,
          payment.transactionId,
          parseFloat(payment.amount),
        ),
      );
    } else {
      // Payment failed
      payment.status = PaymentStatus.FAILED;
      payment.failedAt = new Date();
      payment.failureReason = callbackData.message;
      await this.paymentRepository.save(payment);

      await this.kafkaProducer.sendPaymentFailedEvent(
        new PaymentFailedEvent(
          payment.id,
          payment.orderId,
          callbackData.message,
        ),
      );
    }
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { orderId } });
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { id } });
  }
}
