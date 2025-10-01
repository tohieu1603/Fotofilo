import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ICartRepository } from "../../domain/repositories/cart.repository";
import { Cart } from "../../domain";
import { GetCartQuery } from "../queries/get-cart.query";

@QueryHandler(GetCartQuery)
export class GetCartHandler implements IQueryHandler<GetCartQuery> {
  constructor(
    @Inject('ICartRepository') private readonly cartRepository: ICartRepository
  ) {}

  async execute(query: GetCartQuery): Promise<Cart | null> {
    const { userId } = query;
    return await this.cartRepository.findByUserId(userId);
  }
}