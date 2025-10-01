import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { AssignRoleToUserCommand } from "../commands/user.commands";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { IRoleRepository } from "../../domain/repositories/role.repository.interface";
import { UserCacheService } from "../services/user-cache.service";

@Injectable()
@CommandHandler(AssignRoleToUserCommand)
export class AssignRoleToUserHandler
  implements ICommandHandler<AssignRoleToUserCommand, Auth.AssignRoleToUserResponse>
{
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    @Inject("IRoleRepository")
    private readonly roleRepository: IRoleRepository,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(command: AssignRoleToUserCommand): Promise<Auth.AssignRoleToUserResponse> {
    const { userId, roleId } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    const updatedUser = user.assignRoles([{ id: role.id, name: role.name }]);
    await this.userRepository.save(updatedUser);
    await this.userCacheService.cache(updatedUser);

    return {
      userRoleId: `${userId}:${roleId}`,
    };
  }
}