import { Injectable, Logger } from "@nestjs/common";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { CartEntity, CartItemEntity } from "../entities";
import { Repository } from "typeorm";
import { Cart } from "../../domain";
import { CartMapper } from "../mappers/cart.mapper";
import { RedisService } from "../../shared/redis/redis.service";


/**
 * Description placeholder
 *
 * @export
 * @class CartRepository
 * @typedef {CartRepository}
 * @implements {ICartRepository}
 */
@Injectable()
export class CartRepository implements ICartRepository {

    /**
 * Description placeholder
 *
 * @private
 * @readonly
 * @type {*}
 */
private readonly logger = new Logger(CartRepository.name);
    /**
 * Creates an instance of CartRepository.
 *
 * @constructor
 * @param {Repository<CartEntity>} cartEntityRepository 
 * @param {Repository<CartItemEntity>} cartItemRepository 
 * @param {RedisService} redis 
 */
constructor(
        @InjectRepository(CartEntity)
        private readonly cartEntityRepository: Repository<CartEntity>,
        @InjectRepository(CartItemEntity)
        private readonly cartItemRepository: Repository<CartItemEntity>,
        private readonly redis: RedisService
    ) { }

    /**
 * Description placeholder
 *
 * @async
 * @param {Cart} cart 
 * @returns {Promise<Cart>} 
 */
async save(cart: Cart): Promise<Cart> {
        try {
            const cartEntity = CartMapper.toPersistence(cart);
            const saveCart = await this.cartEntityRepository.save(cartEntity);

            const domainCart = CartMapper.toDomain(saveCart);

            await this.redis.set(
                `cart:${cart.userId}`,
                JSON.stringify(domainCart),
                30
            );

            return domainCart
        } catch (error) {
            this.logger.error(`Failed to save cart for user=${cart.userId}`, error.stack);
            throw error;
        }
    }


    /**
 * Description placeholder
 *
 * @async
 * @param {string} userId 
 * @returns {Promise<Cart | null>} 
 */
async findByUserId(userId: string): Promise<Cart | null> {
        const cacheKey = `cart:${userId}`;
        try {
            const cached = await this.redis.get(cacheKey)
            if(cached) {
                this.logger.debug(`Cache hit for ${userId}`)
                const cartData = JSON.parse(cached as string);
                // Convert cached plain object back to domain object
                return Cart.fromExisting({
                    id: typeof cartData.id === 'object' ? cartData.id.value : cartData.id,
                    userId: cartData.userId,
                    items: cartData._items?.map((item: { 
                        id: string | { value: string }; 
                        cartId: string; 
                        skuId: string; 
                        quantity: number; 
                        price: number; 
                        image: string; 
                        itemDetail: object; 
                        createdAt: string | Date; 
                        updatedAt: string | Date 
                    }) => CartMapper.toDomainItem({
                        id: typeof item.id === 'object' ? item.id.value : item.id,
                        cartId: item.cartId,
                        skuId: item.skuId,
                        quantity: item.quantity,
                        price: item.price,
                        image: item.image,
                        itemDetail: item.itemDetail,
                        createdAt: new Date(item.createdAt),
                        updatedAt: new Date(item.updatedAt),
                    } as CartItemEntity)) || [],
                    createdAt: new Date(cartData.createdAt),
                    updatedAt: new Date(cartData.updatedAt),
                });
            }
            this.logger.debug(`Cache miss for ${userId}`)
            const cartEntity = await this.cartEntityRepository.findOne({
                where: { userId },
                relations: ["items"],
            });

            if(!cartEntity) return null

            const domainCart = CartMapper.toDomain(cartEntity);

            await this.redis.set(cacheKey, JSON.stringify(domainCart), 30)

            return domainCart
        } catch (error) {
            this.logger.error(`Failed to find cart for user=${userId}`, error.stack);
            return null;
        }
    }
    async delete(cartId: string): Promise<boolean> {
        try {
            const cart = await this.cartEntityRepository.findOne({
                where: { id: cartId }
            });

            if (!cart) {
                return false;
            }

            await this.cartItemRepository.delete({ cartId: cartId });
            
            const result = await this.cartEntityRepository.delete(cartId);

            if (result.affected > 0) {
                await this.redis.del(`cart:${cart.userId}`)
                return true
            }

            return false
        } catch (error) {
             this.logger.error(`Failed to delete cart=${cartId}`, error.stack);
            return false;
        }
    }
}