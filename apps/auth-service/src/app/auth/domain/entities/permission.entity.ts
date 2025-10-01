export class Permission {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly isActive = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    name: string,
    resource: string,
    action: string,
    displayName: string,
    description: string,
    isActive = true,
  ): Permission {
    return new Permission(
      id,
      name,
      resource,
      action,
      displayName,
      description,
      isActive,
    );
  }

  update(
    name: string,
    resource: string,
    action: string,
    displayName: string,
    description: string,
    isActive: boolean,
  ): Permission {
    return new Permission(
      this.id,
      name,
      resource,
      action,
      displayName,
      description,
      isActive,
      this.createdAt,
      new Date(),
    );
  }

  activate(): Permission {
    return new Permission(
      this.id,
      this.name,
      this.resource,
      this.action,
      this.displayName,
      this.description,
      true,
      this.createdAt,
      new Date(),
    );
  }

  deactivate(): Permission {
    return new Permission(
      this.id,
      this.name,
      this.resource,
      this.action,
      this.displayName,
      this.description,
      false,
      this.createdAt,
      new Date(),
    );
  }

  matches(resource: string, action: string): boolean {
    return this.resource === resource && this.action === action;
  }
}