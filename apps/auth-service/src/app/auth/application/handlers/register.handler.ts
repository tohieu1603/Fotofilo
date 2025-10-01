import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { Auth } from '@nestcm/proto';
import { RegisterCommand } from '../commands/auth.commands';
import { User, UserRole } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { TokenService } from '../services/token.service';
import { v4 as uuidv4 } from 'uuid';
import { UserCacheService } from '../services/user-cache.service';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler
  implements ICommandHandler<RegisterCommand, Auth.AuthResponse>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly userCacheService: UserCacheService,
  ) {}

  async execute(command: RegisterCommand): Promise<Auth.AuthResponse> {
    const { name, email, phone, password } = command;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const userId = uuidv4();
    const userRoles: UserRole[] = [];
    const user = await User.create(userId, name, email, phone, password, userRoles);

    await this.userRepository.save(user);
    await this.userCacheService.cache(user);

    const tokens = await this.tokenService.generateTokens(
      userId,
      user.email.getValue(),
      user.roleNames,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId,
      email: user.email.getValue(),
      roles: user.roleNames,
    };
  }
}