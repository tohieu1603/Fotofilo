export class GetAllUsersQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
  ) {}
}

export class GetUserByIdQuery {
  constructor(
    public readonly id: string,
  ) {}
}

export class GetUserByEmailQuery {
  constructor(
    public readonly email: string,
  ) {}
}

export class GetAllRolesQuery {
  readonly type = 'GetAllRolesQuery';
}

export class GetAllPermissionsQuery {
  readonly type = 'GetAllPermissionsQuery';
}