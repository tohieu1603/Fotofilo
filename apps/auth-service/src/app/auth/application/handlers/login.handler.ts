import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Auth } from '@nestcm/proto';
import { LoginCommand } from '../commands/auth.commands';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { TokenService } from '../services/token.service';
import { UserCacheService } from '../services/user-cache.service';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler
  implements ICommandHandler<LoginCommand, Auth.AuthResponse>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(command: LoginCommand): Promise<Auth.AuthResponse> {
    const { email, password } = command;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await user.password.comparePassword(password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userCacheService.cache(user);

    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email.getValue(),
      user.roleNames,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      email: user.email.getValue(),
      roles: user.roleNames,
    };
  }
}