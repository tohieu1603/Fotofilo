export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly isActive = true,
    public readonly isSystem = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    name: string,
    displayName: string,
    description: string,
    isActive = true,
    isSystem = false,
  ): Role {
    return new Role(
      id,
      name,
      displayName,
      description,
      isActive,
      isSystem,
    );
  }

  update(
    name: string,
    displayName: string,
    description: string,
    isActive: boolean,
  ): Role {
    return new Role(
      this.id,
      name,
      displayName,
      description,
      isActive,
      this.isSystem,
      this.createdAt,
      new Date(),
    );
  }

  activate(): Role {
    return new Role(
      this.id,
      this.name,
      this.displayName,
      this.description,
      true,
      this.isSystem,
      this.createdAt,
      new Date(),
    );
  }

  deactivate(): Role {
    if (this.isSystem) {
      throw new Error('Cannot deactivate system role');
    }
    
    return new Role(
      this.id,
      this.name,
      this.displayName,
      this.description,
      false,
      this.isSystem,
      this.createdAt,
      new Date(),
    );
  }
}