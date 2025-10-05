import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { PayMent } from '@nestcm/proto';

interface PaymentServiceGrpc {
  createPayment(request: PayMent.CreatePaymentRequest): Observable<PayMent.PaymentResponse>;
  getPaymentByOrderId(request: PayMent.GetPaymentByOrderIdRequest): Observable<PayMent.PaymentResponse>;
}

@Injectable()
export class PaymentServiceClient implements OnModuleInit {
  private readonly logger = new Logger(PaymentServiceClient.name);
  private paymentService: PaymentServiceGrpc;

  constructor(
    @Inject('PAYMENT_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentServiceGrpc>('PaymentService');
    this.logger.log('Payment Service client initialized');
  }

  async createPayment(
    orderId: string,
    customerId: string,
    amount: number,
    currency: string,
    paymentMethod: 'COD' | 'MOMO' | 'VNPAY' | 'STRIPE',
    orderInfo: string,
  ): Promise<PayMent.PaymentResponse> {
    const paymentMethodMap: Record<string, PayMent.PaymentMethod> = {
      COD: PayMent.PaymentMethod.PAYMENT_METHOD_COD,
      MOMO: PayMent.PaymentMethod.PAYMENT_METHOD_MOMO,
      VNPAY: PayMent.PaymentMethod.PAYMENT_METHOD_VNPAY,
      STRIPE: PayMent.PaymentMethod.PAYMENT_METHOD_STRIPE,
    };

    const request: PayMent.CreatePaymentRequest = {
      orderId,
      customerId,
      amount: {
        amount,
        currency,
      },
      paymentMethod: paymentMethodMap[paymentMethod] || PayMent.PaymentMethod.PAYMENT_METHOD_COD,
      orderInfo,
    };

    this.logger.log(`Creating payment for order ${orderId} with method ${paymentMethod}`);

    try {
      const response = await firstValueFrom(
        this.paymentService.createPayment(request),
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to create payment: ${error.message}`);
      throw error;
    }
  }

  async getPaymentByOrderId(orderId: string): Promise<PayMent.PaymentResponse> {
    try {
      const response = await firstValueFrom(
        this.paymentService.getPaymentByOrderId({ orderId }),
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to get payment for order ${orderId}: ${error.message}`);
      throw error;
    }
  }
}
