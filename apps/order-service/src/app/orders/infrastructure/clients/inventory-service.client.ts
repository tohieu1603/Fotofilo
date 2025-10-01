import { ClientGrpc, Inventory, Metadata } from "@nestcm/proto";
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { firstValueFrom } from "rxjs";


@Injectable()
export class InventoryServiceClient implements OnModuleInit {
    private inventoryService: Inventory.InventoryServiceClient;

    constructor(
        @Inject('INVENTORY_PACKAGE')
        private readonly client: ClientGrpc
    ) {}

    onModuleInit() {
        this.inventoryService = this.client.getService<Inventory.InventoryServiceClient>('InventoryService');
    }

    async checkInventory(request: Inventory.CheckStockRequest): Promise<Inventory.CheckStockResponse> {
        if(!request.skuCodes || request.skuCodes.length === 0) {
            throw new Error('SKU codes are required');
        }
        const result = await firstValueFrom(this.inventoryService.checkStock(request, new Metadata()));

        return result;
    }
}