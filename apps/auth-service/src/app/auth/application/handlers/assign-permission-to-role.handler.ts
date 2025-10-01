import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { AssignPermissionToRoleCommand } from "../commands/user.commands";
import { IRoleRepository } from "../../domain/repositories/role.repository.interface";
import { IPermissionRepository } from "../../domain/repositories/permission.repository.interface";

@Injectable()
@CommandHandler(AssignPermissionToRoleCommand)
export class AssignPermissionToRoleHandler
  implements ICommandHandler<AssignPermissionToRoleCommand, Auth.AssignPermissionToRoleResponse>
{
  constructor(
    @Inject("IRoleRepository")
    private readonly roleRepository: IRoleRepository,
    @Inject("IPermissionRepository")
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(command: AssignPermissionToRoleCommand): Promise<Auth.AssignPermissionToRoleResponse> {
    const { roleId, permissionId } = command;

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new Error("Permission not found");
    }

    await this.roleRepository.assignPermission(roleId, permissionId);

    return {
      rolePermissionId: `${roleId}:${permissionId}`,
    };
  }
}