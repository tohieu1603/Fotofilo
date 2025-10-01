import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UpdateOrderStatusCommand, AddOrderTrackingCommand, CancelOrderCommand } from '../commands/order.commands';
import { TypeOrmOrderRepository } from '../../infrastructure/repositories/typeorm-order.repository';
import { OrderDto } from '../dto/order.dto';

export interface OrderCommandResult {
  success: boolean;
  message?: string;
  error?: string;
}

@CommandHandler(UpdateOrderStatusCommand)
export class UpdateOrderStatusHandler implements ICommandHandler<UpdateOrderStatusCommand> {
  private readonly logger = new Logger(UpdateOrderStatusHandler.name);

  constructor(private readonly orderRepository: TypeOrmOrderRepository) {}

  async execute(command: UpdateOrderStatusCommand): Promise<OrderCommandResult> {
    try {
      this.logger.log(`Updating order ${command.orderId} to ${command.status}`);

      const order = await this.orderRepository.findById(command.orderId);
      if (!order) {
        return {
          success: false,
          error: `Order with ID ${command.orderId} not found`,
        };
      }

      const updatedOrder: OrderDto = {
        ...order,
        status: command.status,
        notes: command.notes ?? order.notes,
        updatedAt: new Date(),
      };

      await this.orderRepository.save(updatedOrder);

      return {
        success: true,
        message: `Order status updated to ${command.status}`,
      };
    } catch (error) {
      this.logger.error('Error updating order status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

@CommandHandler(AddOrderTrackingCommand)
export class AddOrderTrackingHandler implements ICommandHandler<AddOrderTrackingCommand> {
  private readonly logger = new Logger(AddOrderTrackingHandler.name);

  constructor(private readonly orderRepository: TypeOrmOrderRepository) {}

  async execute(command: AddOrderTrackingCommand): Promise<OrderCommandResult> {
    try {
      this.logger.log(`Adding tracking ${command.trackingNumber} to order ${command.orderId}`);

      const order = await this.orderRepository.findById(command.orderId);
      if (!order) {
        return {
          success: false,
          error: `Order with ID ${command.orderId} not found`,
        };
      }

      const updatedOrder: OrderDto = {
        ...order,
        trackingNumber: command.trackingNumber,
        updatedAt: new Date(),
      };

      await this.orderRepository.save(updatedOrder);

      return {
        success: true,
        message: `Tracking number ${command.trackingNumber} added to order`,
      };
    } catch (error) {
      this.logger.error('Error adding order tracking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  private readonly logger = new Logger(CancelOrderHandler.name);

  constructor(private readonly orderRepository: TypeOrmOrderRepository) {}

  async execute(command: CancelOrderCommand): Promise<OrderCommandResult> {
    try {
      this.logger.log(`Cancelling order ${command.orderId}`);

      const order = await this.orderRepository.findById(command.orderId);
      if (!order) {
        return {
          success: false,
          error: `Order with ID ${command.orderId} not found`,
        };
      }

      if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
        return {
          success: false,
          error: `Cannot cancel order in ${order.status} status`,
        };
      }

      if (order.status === 'CANCELLED') {
        return {
          success: false,
          error: 'Order is already cancelled',
        };
      }

      const updatedOrder: OrderDto = {
        ...order,
        status: 'CANCELLED',
        notes: `${order.notes ?? ''}\nCancelled: ${command.reason}`.trim(),
        updatedAt: new Date(),
      };

      await this.orderRepository.save(updatedOrder);

      return {
        success: true,
        message: `Order cancelled successfully. Reason: ${command.reason}`,
      };
    } catch (error) {
      this.logger.error('Error cancelling order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}