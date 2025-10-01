import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InventoryManagerService } from '@nestcm/common';

export class CommitOrderInventoryCommand {
  constructor(public readonly orderId: string) {}
}

export class ReleaseOrderInventoryCommand {
  constructor(public readonly orderId: string) {}
}

@CommandHandler(CommitOrderInventoryCommand)
@Injectable()
export class CommitOrderInventoryHandler implements ICommandHandler<CommitOrderInventoryCommand> {
  private readonly logger = new Logger(CommitOrderInventoryHandler.name);

  constructor(private readonly inventoryManagerService: InventoryManagerService) {}

  async execute(command: CommitOrderInventoryCommand): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log(`Committing inventory for order ${command.orderId}`);

      const result = await this.inventoryManagerService.commitOrderInventory(command.orderId);

      if (result.success) {
        this.logger.log(`Successfully committed inventory for order ${command.orderId}`);
        return { success: true };
      } else {
        this.logger.warn(`Failed to commit inventory for order ${command.orderId}: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.logger.error(`Error committing inventory for order ${command.orderId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

@CommandHandler(ReleaseOrderInventoryCommand)
@Injectable()
export class ReleaseOrderInventoryHandler implements ICommandHandler<ReleaseOrderInventoryCommand> {
  private readonly logger = new Logger(ReleaseOrderInventoryHandler.name);

  constructor(private readonly inventoryManagerService: InventoryManagerService) {}

  async execute(command: ReleaseOrderInventoryCommand): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log(`Releasing inventory for order ${command.orderId}`);

      const result = await this.inventoryManagerService.releaseOrderInventory(command.orderId);

      if (result.success) {
        this.logger.log(`Successfully released inventory for order ${command.orderId}`);
        return { success: true };
      } else {
        this.logger.warn(`Failed to release inventory for order ${command.orderId}: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.logger.error(`Error releasing inventory for order ${command.orderId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}