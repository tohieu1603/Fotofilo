import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  findByToken(token: string): Promise<RefreshToken | null>;
  findByUserId(userId: string): Promise<RefreshToken[]>;
  save(refreshToken: RefreshToken): Promise<void>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<void>;
}