import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { CreateRoleCommand } from "../commands/user.commands";
import { IRoleRepository } from "../../domain/repositories/role.repository.interface";
import { Role } from "../../domain/entities/role.entity";
import { v4 as uuidv4 } from "uuid";
import { toProtoRole } from "../mappers/user-proto.mapper";

@Injectable()
@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler
  implements ICommandHandler<CreateRoleCommand, Auth.RoleResponse>
{
  constructor(
    @Inject("IRoleRepository")
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: CreateRoleCommand): Promise<Auth.RoleResponse> {
    const { name, displayName, description, isActive, isSystem } = command;

    const existingRole = await this.roleRepository.findByName(name);
    if (existingRole) {
      throw new Error("Role already exists with this name");
    }

    const roleId = uuidv4();
    const role = Role.create(roleId, name, displayName, description, isActive, isSystem);

    await this.roleRepository.save(role);

    return {
      role: toProtoRole(role),
    };
  }
}