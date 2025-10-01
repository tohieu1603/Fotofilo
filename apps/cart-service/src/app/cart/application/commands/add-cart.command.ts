import { ItemDetail } from "../../domain/entities/cart-item-entity";

// add-cart.command.ts
export class AddToCartCommand {
  constructor(
    public readonly userId: string,
    public readonly skuId: string,
    public readonly quantity: number,
    public readonly price?: number,
    public readonly itemDetail?: ItemDetail,
  ) {}
}
