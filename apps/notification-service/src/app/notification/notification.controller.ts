import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService, OrderCreatedEvent } from './notification.service';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: OrderCreatedEvent) {
    this.logger.log(`Received order.created event for order ${data.orderNumber}`);

    try {
      await this.notificationService.sendOrderCreatedNotification(data);
    } catch (error) {
      this.logger.error(`Failed to handle order.created event: ${error.message}`, error.stack);
    }
  }
}