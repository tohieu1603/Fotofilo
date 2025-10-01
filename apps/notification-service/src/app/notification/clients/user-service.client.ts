import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

interface UserServiceInterface {
  getUser(data: { id: string }): Promise<{
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

@Injectable()
export class UserServiceClient implements OnModuleInit {
  private readonly logger = new Logger(UserServiceClient.name);
  private userService: UserServiceInterface;

  constructor(@Inject('USER_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceInterface>('UserService');
  }

  async getUserById(userId: string): Promise<{ email: string; name: string } | null> {
    try {
      this.logger.log(`Fetching user data for ID: ${userId}`);

      const user = await this.userService.getUser({ id: userId });

      if (!user) {
        this.logger.warn(`User not found for ID: ${userId}`);
        return null;
      }

      return {
        email: user.email,
        name: user.name,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch user ${userId}: ${error.message}`, error.stack);
      return null;
    }
  }
}