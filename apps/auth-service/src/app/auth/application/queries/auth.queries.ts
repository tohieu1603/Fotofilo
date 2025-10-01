export class ValidateTokenQuery {
  constructor(
    public readonly accessToken: string,
  ) {}
}

export class CheckPermissionQuery {
  constructor(
    public readonly userId: string,
    public readonly resource: string,
    public readonly action: string,
  ) {}
}

export class GetUserPermissionsQuery {
  constructor(
    public readonly userId: string,
  ) {}
}

export class CheckRoleQuery {
  constructor(
    public readonly userId: string,
    public readonly roleNames: string[],
    public readonly requireAll: boolean,
  ) {}
}

export class GetUserRolesQuery {
  constructor(
    public readonly userId: string,
  ) {}
}