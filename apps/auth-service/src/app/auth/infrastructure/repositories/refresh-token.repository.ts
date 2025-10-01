import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenEntityRepository: Repository<RefreshTokenEntity>,
  ) {}

  async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenEntity = await this.refreshTokenEntityRepository.findOne({
      where: { token },
    });

    return tokenEntity ? this.toDomain(tokenEntity) : null;
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const tokenEntities = await this.refreshTokenEntityRepository.find({
      where: { userId },
    });

    return tokenEntities.map((entity) => this.toDomain(entity));
  }

  async save(refreshToken: RefreshToken): Promise<void> {
    const tokenEntity = this.toPersistence(refreshToken);
    await this.refreshTokenEntityRepository.save(tokenEntity);
  }

  async delete(id: string): Promise<void> {
    await this.refreshTokenEntityRepository.delete(id);
  }

  async deleteExpired(): Promise<void> {
    await this.refreshTokenEntityRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }

  private toDomain(entity: RefreshTokenEntity): RefreshToken {
    return RefreshToken.fromExisting(
      entity.id,
      entity.userId,
      entity.token,
      entity.expiresAt,
      entity.isRevoked,
      entity.createdAt,
    );
  }

  private toPersistence(refreshToken: RefreshToken): RefreshTokenEntity {
    const entity = new RefreshTokenEntity();
    entity.id = refreshToken.id;
    entity.userId = refreshToken.userId;
    entity.token = refreshToken.token;
    entity.expiresAt = refreshToken.expiresAt;
    entity.isRevoked = refreshToken.isRevoked;
    entity.createdAt = refreshToken.createdAt;
    return entity;
  }
}
