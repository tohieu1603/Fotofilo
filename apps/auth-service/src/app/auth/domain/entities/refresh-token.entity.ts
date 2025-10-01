export class RefreshToken {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly isRevoked: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    userId: string,
    token: string,
    expiresAt: Date,
  ): RefreshToken {
    return new RefreshToken(id, userId, token, expiresAt, false, new Date());
  }

  static fromExisting(
    id: string,
    userId: string,
    token: string,
    expiresAt: Date,
    isRevoked = false,
    createdAt?: Date,
  ): RefreshToken {
    return new RefreshToken(id, userId, token, expiresAt, isRevoked, createdAt ?? new Date());
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  revoke(): RefreshToken {
    return RefreshToken.fromExisting(
      this.id,
      this.userId,
      this.token,
      this.expiresAt,
      true,
      this.createdAt,
    );
  }
}
