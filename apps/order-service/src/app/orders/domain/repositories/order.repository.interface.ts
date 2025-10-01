import { Order } from '../entities/order-entity';

export interface IOrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByCustomerId(
    customerId: string,
    limit?: number,
    offset?: number,
  ): Promise<Order[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export const IOrderRepository = Symbol('IOrderRepository');