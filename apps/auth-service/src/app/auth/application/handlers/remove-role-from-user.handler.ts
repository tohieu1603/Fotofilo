import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { RemoveRoleFromUserCommand } from "../commands/user.commands";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { IRoleRepository } from "../../domain/repositories/role.repository.interface";
import { UserCacheService } from "../services/user-cache.service";

@Injectable()
@CommandHandler(RemoveRoleFromUserCommand)
export class RemoveRoleFromUserHandler
  implements ICommandHandler<RemoveRoleFromUserCommand, Auth.RemoveRoleFromUserResponse>
{
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    @Inject("IRoleRepository")
    private readonly roleRepository: IRoleRepository,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(command: RemoveRoleFromUserCommand): Promise<Auth.RemoveRoleFromUserResponse> {
    const { userId, roleId } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    if (!user.hasRoleId(roleId)) {
      return {
        success: true,
      };
    }

    const updatedUser = user.removeRoles([roleId]);
    await this.userRepository.save(updatedUser);
    await this.userCacheService.cache(updatedUser);

    return {
      success: true,
    };
  }
}