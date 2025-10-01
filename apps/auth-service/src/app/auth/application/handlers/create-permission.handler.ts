import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { CreatePermissionCommand } from "../commands/user.commands";
import { IPermissionRepository } from "../../domain/repositories/permission.repository.interface";
import { Permission } from "../../domain/entities/permission.entity";
import { v4 as uuidv4 } from "uuid";
import { toProtoPermission } from "../mappers/user-proto.mapper";

@Injectable()
@CommandHandler(CreatePermissionCommand)
export class CreatePermissionHandler
  implements ICommandHandler<CreatePermissionCommand, Auth.PermissionResponse>
{
  constructor(
    @Inject("IPermissionRepository")
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute(command: CreatePermissionCommand): Promise<Auth.PermissionResponse> {
    const { name, resource, action, displayName, description, isActive } = command;

    const existingPermission = await this.permissionRepository.findByResourceAndAction(
      resource,
      action,
    );
    if (existingPermission) {
      throw new Error("Permission already exists for this resource/action");
    }

    const permissionId = uuidv4();
    const permission = Permission.create(
      permissionId,
      name,
      resource,
      action,
      displayName,
      description,
      isActive,
    );

    await this.permissionRepository.save(permission);

    return {
      permission: toProtoPermission(permission),
    };
  }
}