import { Cart } from "../entities";


export interface ICartRepository {
    save(cart: Cart): Promise<Cart>;
    findByUserId(userId: string): Promise<Cart | null>;
    delete(cartId: string): Promise<boolean>;
}