import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';

interface TokenPayload {
  sub: string;
  email: string;
  roles?: string[];
}

@Injectable()
export class TokenService {
  private readonly accessTokenSecret =
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default-secret';

  private readonly refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET || this.accessTokenSecret;

  constructor(
    private readonly jwtService: JwtService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async generateTokens(userId: string, email: string, roles: string[] = []) {
    const payload: TokenPayload = { sub: userId, email, roles };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessTokenSecret,
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: '7d',
    });

    const refreshTokenEntity = RefreshToken.create(
      uuidv4(),
      userId,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.accessTokenSecret,
      });
    } catch {
      throw new Error('Invalid token');
    }
  }

  async verifyRefreshToken(refreshToken: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new Error('Invalid refresh token');
    }
  }
}
