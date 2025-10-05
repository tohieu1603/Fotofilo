import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateOrderStatusCommand } from '../../application/commands/order.commands';

@Injectable()
export class PaymentEventConsumer {
  private readonly logger = new Logger(PaymentEventConsumer.name);

  constructor(private readonly commandBus: CommandBus) {}

  @MessagePattern('payment.success')
  async handlePaymentSuccess(@Payload() message: any) {
    const data = message.value ? JSON.parse(message.value) : message;

    this.logger.log(`Received payment.success event for order ${data.orderId}`);

    try {
      await this.commandBus.execute(
        new UpdateOrderStatusCommand(
          data.orderId,
          'PROCESSING',
          `Payment successful. Transaction ID: ${data.transactionId}`,
        ),
      );

      this.logger.log(`Order ${data.orderId} updated to PROCESSING after successful payment`);
    } catch (error) {
      this.logger.error(`Failed to update order ${data.orderId}: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern('payment.failed')
  async handlePaymentFailed(@Payload() message: any) {
    const data = message.value ? JSON.parse(message.value) : message;

    this.logger.log(`Received payment.failed event for order ${data.orderId}`);

    try {
      await this.commandBus.execute(
        new UpdateOrderStatusCommand(
          data.orderId,
          'CANCELLED',
          `Payment failed: ${data.reason}`,
        ),
      );

      this.logger.log(`Order ${data.orderId} cancelled due to payment failure`);
    } catch (error) {
      this.logger.error(`Failed to cancel order ${data.orderId}: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern('payment.pending')
  async handlePaymentPending(@Payload() message: any) {
    const data = message.value ? JSON.parse(message.value) : message;

    this.logger.log(`Received payment.pending event for order ${data.orderId}`);

    // For COD or awaiting online payment - keep order in PENDING status
    // You could add payment URL to order notes if needed
    if (data.paymentUrl) {
      this.logger.log(`Payment URL for order ${data.orderId}: ${data.paymentUrl}`);

      // Optionally update order notes with payment URL
      await this.commandBus.execute(
        new UpdateOrderStatusCommand(
          data.orderId,
          'PENDING',
          `Awaiting payment. Payment URL: ${data.paymentUrl}`,
        ),
      );
    }
  }
}
