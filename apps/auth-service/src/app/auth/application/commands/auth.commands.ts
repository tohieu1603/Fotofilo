export class RegisterCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly password: string,
  ) {}
}

export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

export class RefreshTokenCommand {
  constructor(
    public readonly refreshToken: string,
  ) {}
}

export class LogoutCommand {
  constructor(
    public readonly refreshToken: string,
  ) {}
}