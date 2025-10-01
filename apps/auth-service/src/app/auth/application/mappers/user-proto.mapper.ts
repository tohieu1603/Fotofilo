import { Auth } from "@nestcm/proto";
import { User } from "../../domain/entities/user.entity";
import { Role } from "../../domain/entities/role.entity";
import { Permission } from "../../domain/entities/permission.entity";

export const toProtoUser = (user: User): Auth.User => ({
  id: user.id,
  name: user.name,
  email: user.email.getValue(),
  phone: user.phone,
  roles: user.roleIds,
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

export const toProtoUserResponse = (user: User): Auth.UserResponse => ({
  user: toProtoUser(user),
});

export const toProtoRole = (role: Role): Auth.Role => ({
  id: role.id,
  name: role.name,
  displayName: role.displayName,
  description: role.description ?? "",
  isActive: role.isActive,
  isSystem: role.isSystem,
});

export const toProtoPermission = (permission: Permission): Auth.Permission => ({
  id: permission.id,
  name: permission.name,
  resource: permission.resource,
  action: permission.action,
  displayName: permission.displayName,
  description: permission.description ?? "",
  isActive: permission.isActive,
});