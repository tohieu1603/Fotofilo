import { Email } from '../value-object/email.vo';
import { Password } from '../value-object/password.vo';

export interface UserRole {
  id: string;
  name: string;
}

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly phone: string,
    public readonly password: Password,
    public readonly roles: UserRole[] = [],
    public readonly isActive = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static async create(
    id: string,
    name: string,
    email: string,
    phone: string,
    password: string,
    roles: UserRole[] = [],
  ): Promise<User> {
    return new User(
      id,
      name,
      Email.create(email),
      phone,
      await Password.create(password),
      roles,
    );
  }

  static fromExisting(params: {
    id: string;
    name: string;
    email: string;
    phone: string;
    hashedPassword: string;
    roles?: UserRole[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): User {
    return new User(
      params.id,
      params.name,
      Email.create(params.email),
      params.phone,
      Password.fromHash(params.hashedPassword),
      params.roles ?? [],
      params.isActive ?? true,
      params.createdAt ?? new Date(),
      params.updatedAt ?? new Date(),
    );
  }

  get roleIds(): string[] {
    return this.roles.map((role) => role.id);
  }

  get roleNames(): string[] {
    return this.roles.map((role) => role.name);
  }

  updateProfile(name: string, phone: string, email: string): User {
    return new User(
      this.id,
      name,
      Email.create(email),
      phone,
      this.password,
      this.roles,
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  assignRoles(roles: UserRole[]): User {
    const roleMap = new Map(this.roles.map((role) => [role.id, role] as const));
    roles.forEach((role) => {
      roleMap.set(role.id, role);
    });

    return new User(
      this.id,
      this.name,
      this.email,
      this.phone,
      this.password,
      Array.from(roleMap.values()),
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  removeRoles(roleIds: string[]): User {
    const remainingRoles = this.roles.filter((role) => !roleIds.includes(role.id));

    return new User(
      this.id,
      this.name,
      this.email,
      this.phone,
      this.password,
      remainingRoles,
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  activate(): User {
    return new User(
      this.id,
      this.name,
      this.email,
      this.phone,
      this.password,
      this.roles,
      true,
      this.createdAt,
      new Date(),
    );
  }

  deactivate(): User {
    return new User(
      this.id,
      this.name,
      this.email,
      this.phone,
      this.password,
      this.roles,
      false,
      this.createdAt,
      new Date(),
    );
  }

  async changePassword(newPassword: string): Promise<User> {
    return new User(
      this.id,
      this.name,
      this.email,
      this.phone,
      await Password.create(newPassword),
      this.roles,
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  hasRole(roleName: string): boolean {
    return this.roles.some((role) => role.name === roleName);
  }

  hasRoleId(roleId: string): boolean {
    return this.roles.some((role) => role.id === roleId);
  }

  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some((roleName) => this.hasRole(roleName));
  }

  hasAllRoles(roleNames: string[]): boolean {
    return roleNames.every((roleName) => this.hasRole(roleName));
  }
}