import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Auth } from '@nestcm/proto';
import { RefreshTokenCommand } from '../commands/auth.commands';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { TokenService } from '../services/token.service';

@Injectable()
@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand, Auth.AuthResponse>
{
  constructor(
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<Auth.AuthResponse> {
    const { refreshToken } = command;

    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);

      const tokenEntity = await this.refreshTokenRepository.findByToken(refreshToken);
      if (!tokenEntity) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (tokenEntity.isExpired() || tokenEntity.isRevoked) {
        throw new UnauthorizedException('Refresh token expired or revoked');
      }

      const revokedToken = tokenEntity.revoke();
      await this.refreshTokenRepository.save(revokedToken);

      const tokens = await this.tokenService.generateTokens(
        payload.sub,
        payload.email,
        payload.roles ?? [],
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}