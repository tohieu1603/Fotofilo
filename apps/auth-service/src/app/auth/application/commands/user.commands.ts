export class CreateUserCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly password: string,
    public readonly rolesId: string[] = [],
  ) {}
}

export class UpdateUserCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly email: string,
    public readonly rolesId: string[] = [],
    public readonly isActive: boolean,
  ) {}
}

export class DeleteUserCommand {
  constructor(public readonly id: string) {}
}

export class CreateRoleCommand {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly isActive = true,
    public readonly isSystem = false,
  ) {}
}

export class UpdateRoleCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly isActive: boolean,
  ) {}
}

export class DeleteRoleCommand {
  constructor(public readonly id: string) {}
}

export class AssignRoleToUserCommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly assignedBy?: string,
    public readonly expiresAt?: string,
  ) {}
}

export class RemoveRoleFromUserCommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
  ) {}
}

export class CreatePermissionCommand {
  constructor(
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly isActive = true,
  ) {}
}

export class UpdatePermissionCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly isActive: boolean,
  ) {}
}

export class DeletePermissionCommand {
  constructor(public readonly id: string) {}
}

export class AssignPermissionToRoleCommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
  ) {}
}

export class RemovePermissionFromRoleCommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
  ) {}
}
