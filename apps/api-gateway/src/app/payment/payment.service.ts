import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

interface PaymentServiceClient {
  getPaymentById(data: { id: string }): any;
  getPaymentByOrderId(data: { orderId: string }): any;
  handleMoMoCallback(data: Record<string, any>): any;
}

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private paymentService: PaymentServiceClient;

  constructor(@Inject('PAYMENT_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentServiceClient>('PaymentService');
  }

  async getPaymentById(id: string) {
    return firstValueFrom(this.paymentService.getPaymentById({ id }));
  }

  async getPaymentByOrderId(orderId: string) {
    return firstValueFrom(this.paymentService.getPaymentByOrderId({ orderId }));
  }

  async handleMoMoCallback(body: Record<string, any>) {
    return firstValueFrom(this.paymentService.handleMoMoCallback(body));
  }
}
