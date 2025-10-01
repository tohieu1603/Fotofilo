import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { GetAllUsersQuery } from "../queries/user.queries";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { toProtoUser } from "../mappers/user-proto.mapper";

@Injectable()
@QueryHandler(GetAllUsersQuery)
export class GetAllUsersHandler
  implements IQueryHandler<GetAllUsersQuery, Auth.GetAllUserResponse>
{
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetAllUsersQuery): Promise<Auth.GetAllUserResponse> {
    const { page, limit, search } = query;
    const normalizedPage = page > 0 ? page : 1;
    const normalizedLimit = limit > 0 ? limit : 10;

    const { users, total } = await this.userRepository.findAll(
      normalizedPage,
      normalizedLimit,
      search,
    );

    return {
      users: users.map(toProtoUser),
      total,
      page: normalizedPage,
      limit: normalizedLimit,
    };
  }
}