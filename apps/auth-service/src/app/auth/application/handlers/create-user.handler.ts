import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { v4 as uuidv4 } from "uuid";
import { CreateUserCommand } from "../commands/user.commands";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { IRoleRepository } from "../../domain/repositories/role.repository.interface";
import { User, UserRole } from "../../domain/entities/user.entity";
import { UserCacheService } from "../services/user-cache.service";

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler
  implements ICommandHandler<CreateUserCommand, Auth.UserResponse>
{
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    @Inject("IRoleRepository")
    private readonly roleRepository: IRoleRepository,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(command: CreateUserCommand): Promise<Auth.UserResponse> {
    const { name, email, phone, password, rolesId } = command;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists with this email");
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

    const userId = uuidv4();
    const user = await User.create(userId, name, email, phone, password, userRoles);

    await this.userRepository.save(user);

    return this.userCacheService.cache(user);
  }
}