import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentService } from '../application/services/payment.service';

interface CreatePaymentRequest {
  orderId: string;
  customerId: string;
  amount: {
    amount: number;
    currency: string;
  };
  paymentMethod: number;
  orderInfo: string;
}

interface GetPaymentByIdRequest {
  id: string;
}

interface GetPaymentByOrderIdRequest {
  orderId: string;
}

interface MoMoCallbackRequest {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: string;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @GrpcMethod('PaymentService', 'CreatePayment')
  async createPayment(data: CreatePaymentRequest) {
    this.logger.log(`Creating payment for order: ${data.orderId}`);

    const paymentMethodMap: Record<number, any> = {
      1: 'COD',
      2: 'MOMO',
      3: 'VNPAY',
      4: 'STRIPE',
    };

    const payment = await this.paymentService.createPayment({
      orderId: data.orderId,
      customerId: data.customerId,
      amount: data.amount.amount,
      currency: data.amount.currency,
      paymentMethod: paymentMethodMap[data.paymentMethod] || 'COD',
      orderInfo: data.orderInfo,
    });

    return this.toPaymentResponse(payment);
  }

  @GrpcMethod('PaymentService', 'GetPaymentById')
  async getPaymentById(data: GetPaymentByIdRequest) {
    this.logger.log(`Getting payment by ID: ${data.id}`);
    const payment = await this.paymentService.getPaymentById(data.id);

    if (!payment) {
      throw new Error('Payment not found');
    }

    return this.toPaymentResponse(payment);
  }

  @GrpcMethod('PaymentService', 'GetPaymentByOrderId')
  async getPaymentByOrderId(data: GetPaymentByOrderIdRequest) {
    this.logger.log(`Getting payment by order ID: ${data.orderId}`);
    const payment = await this.paymentService.getPaymentByOrderId(data.orderId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    return this.toPaymentResponse(payment);
  }

  @GrpcMethod('PaymentService', 'HandleMoMoCallback')
  async handleMoMoCallback(data: MoMoCallbackRequest) {
    this.logger.log(`Handling MoMo callback for order: ${data.orderId}`);

    try {
      await this.paymentService.handleMoMoCallback({
        partnerCode: data.partnerCode,
        orderId: data.orderId,
        requestId: data.requestId,
        amount: data.amount,
        orderInfo: data.orderInfo,
        orderType: data.orderType,
        transId: data.transId,
        resultCode: data.resultCode,
        message: data.message,
        payType: data.payType,
        responseTime: data.responseTime,
        extraData: data.extraData,
        signature: data.signature,
      });

      return {
        success: true,
        message: 'Callback processed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to process callback: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private toPaymentResponse(payment: any) {
    const paymentMethodMap = {
      COD: 1,
      MOMO: 2,
      VNPAY: 3,
      STRIPE: 4,
    };

    const paymentStatusMap = {
      PENDING: 1,
      PROCESSING: 2,
      SUCCESS: 3,
      FAILED: 4,
      CANCELLED: 5,
    };

    return {
      id: payment.id,
      orderId: payment.orderId,
      customerId: payment.customerId,
      amount: {
        amount: parseFloat(payment.amount),
        currency: payment.currency,
      },
      paymentMethod: paymentMethodMap[payment.paymentMethod] || 0,
      status: paymentStatusMap[payment.status] || 0,
      transactionId: payment.transactionId || '',
      paymentUrl: payment.paymentUrl || '',
      notes: payment.notes || '',
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : '',
      failedAt: payment.failedAt ? payment.failedAt.toISOString() : '',
      failureReason: payment.failureReason || '',
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}
