import { Injectable, Logger } from "@nestjs/common";
import { Auth } from "@nestcm/proto";
import { RedisService } from "../../../shared/redis/redis.service";
import { User } from "../../domain/entities/user.entity";
import { toProtoUserResponse } from "../mappers/user-proto.mapper";

@Injectable()
export class UserCacheService {
  private readonly logger = new Logger(UserCacheService.name);
  private readonly ttlSeconds: number;

  constructor(private readonly redisService: RedisService) {
    const ttl = Number(process.env.USER_CACHE_TTL ?? 300);
    this.ttlSeconds = Number.isFinite(ttl) && ttl > 0 ? ttl : 300;
  }

  async getById(id: string): Promise<Auth.UserResponse | null> {
    return this.redisService.get<Auth.UserResponse>(this.idKey(id));
  }

  async getByEmail(email: string): Promise<Auth.UserResponse | null> {
    return this.redisService.get<Auth.UserResponse>(this.emailKey(email));
  }

  async cache(user: User): Promise<Auth.UserResponse> {
    const response = toProtoUserResponse(user);
    await Promise.all([
      this.redisService.set(this.idKey(user.id), response, this.ttlSeconds),
      this.redisService.set(this.emailKey(user.email.getValue()), response, this.ttlSeconds),
    ]);
    this.logger.debug(`Cached user ${user.id}`);
    return response;
  }

  async invalidateById(id: string): Promise<void> {
    await this.redisService.del(this.idKey(id));
  }

  async invalidateByEmail(email: string): Promise<void> {
    await this.redisService.del(this.emailKey(email));
  }

  async invalidate(user: User): Promise<void> {
    await Promise.all([
      this.invalidateById(user.id),
      this.invalidateByEmail(user.email.getValue()),
    ]);
  }

  private idKey(id: string): string {
    return `auth:users:id:${id}`;
  }

  private emailKey(email: string): string {
    return `auth:users:email:${email.toLowerCase()}`;
  }
}