import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { GetUserByIdQuery, GetUserByEmailQuery } from "../queries/user.queries";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UserCacheService } from "../services/user-cache.service";

@Injectable()
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler
  implements IQueryHandler<GetUserByIdQuery, Auth.UserResponse>
{
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<Auth.UserResponse> {
    const { id } = query;

    const cached = await this.userCacheService.getById(id);
    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    return this.userCacheService.cache(user);
  }
}

@Injectable()
@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler
  implements IQueryHandler<GetUserByEmailQuery, Auth.UserResponse>
{
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(query: GetUserByEmailQuery): Promise<Auth.UserResponse> {
    const { email } = query;

    const cached = await this.userCacheService.getByEmail(email);
    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    return this.userCacheService.cache(user);
  }
}