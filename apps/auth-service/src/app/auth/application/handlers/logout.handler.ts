import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { Auth } from '@nestcm/proto';
import { LogoutCommand } from '../commands/auth.commands';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutHandler
  implements ICommandHandler<LogoutCommand, Auth.LogoutResponse>
{
  constructor(
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<Auth.LogoutResponse> {
    const { refreshToken } = command;

    const tokenEntity = await this.refreshTokenRepository.findByToken(refreshToken);
    if (tokenEntity) {
      const revokedToken = tokenEntity.revoke();
      await this.refreshTokenRepository.save(revokedToken);
    }

    return {
      success: true,
    };
  }
}