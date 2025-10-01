import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { UpdateUserCommand } from "../commands/user.commands";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { IRoleRepository } from "../../domain/repositories/role.repository.interface";
import { User, UserRole } from "../../domain/entities/user.entity";
import { UserCacheService } from "../services/user-cache.service";

@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler
  implements ICommandHandler<UpdateUserCommand, Auth.UserResponse>
{
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    @Inject("IRoleRepository")
    private readonly roleRepository: IRoleRepository,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<Auth.UserResponse> {
    const { id, name, phone, email, rolesId, isActive } = command;

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    const existingWithEmail = await this.userRepository.findByEmail(email);
    if (existingWithEmail && existingWithEmail.id !== id) {
      throw new Error("Another user already uses this email");
    }

    const uniqueRoleIds = Array.from(new Set(rolesId ?? []));
    const roles = uniqueRoleIds.length
      ? await this.roleRepository.findByIds(uniqueRoleIds)
      : [];

    if (roles.length !== uniqueRoleIds.length) {
      throw new Error("One or more roles could not be found");
    }

    const userRoles: UserRole[] = roles.map((role) => ({
      id: role.id,
      name: role.name,
    }));

    const previousEmail = user.email.getValue();

    const updatedUser = User.fromExisting({
      id: user.id,
      name,
      email,
      phone,
      hashedPassword: user.password.getHashValue(),
      roles: userRoles,
      isActive,
      createdAt: user.createdAt,
      updatedAt: new Date(),
    });

    await this.userRepository.save(updatedUser);

    await Promise.all([
      this.userCacheService.invalidateById(updatedUser.id),
      this.userCacheService.invalidateByEmail(previousEmail),
    ]);

    return this.userCacheService.cache(updatedUser);
  }
}