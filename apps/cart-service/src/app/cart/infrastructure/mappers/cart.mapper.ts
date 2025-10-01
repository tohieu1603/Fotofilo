import { Cart, CartItem, ItemDetail } from "../../domain";
import { CartItemEntity } from "../entities";
import { CartEntity } from "../entities/cart-entity";

export class CartMapper {
    static toDomainItem(item: CartItemEntity): CartItem {
        return CartItem.fromExisting({
            id: item.id,
            cartId: item.cartId,
            skuId: item.skuId,
            productId: item.productId,
            skuCode: item.skuCode,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            itemDetail: item.itemDetail as ItemDetail,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        });
    }

    static toPersistenceItem(item: CartItem): CartItemEntity {
        const entity = new CartItemEntity();
        entity.id = item.id.getValue();
        entity.cartId = item.cartId;
        entity.skuId = item.skuId;
        entity.quantity = item.quantity;
        entity.price = item.price;
        entity.image = item.image;
        entity.itemDetail = { ...item.itemDetail } as ItemDetail; 
        entity.createdAt = item.createdAt;
        entity.updatedAt = item.updatedAt;
        return entity;
    }


    static toDomain(cart: CartEntity): Cart {
        return Cart.fromExisting({
            id: cart.id,
            userId: cart.userId,
            items: cart.items?.map(this.toDomainItem) || [],
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
        });
    }

    static toPersistence(cart: Cart): CartEntity {
        const entity = new CartEntity();
        entity.id = cart.id.getValue();
        entity.userId = cart.userId;
        entity.createdAt = cart.createdAt;
        entity.updatedAt = cart.updatedAt;
        entity.items = cart.items.map(this.toPersistenceItem);
        return entity;
    }
}
