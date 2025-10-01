import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { Auth } from '@nestcm/proto';
import { PermissionType } from './decorators/permissions.decorator';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto/auth.dto';

type GrpcUnaryMethod<TRequest, TResponse> = (
  request: TRequest,
  metadata: Metadata,
) => import('rxjs').Observable<TResponse>;

@Injectable()
export class AuthService implements OnModuleInit {
  private clientRef: Auth.AuthServiceClient | null = null;
  private readonly metadata = new Metadata();

  constructor(@Inject(Auth.AUTH_PACKAGE_NAME) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.clientRef = this.client.getService<Auth.AuthServiceClient>(
      Auth.AUTH_SERVICE_NAME,
    );
  }

  async register(registerDto: RegisterDto): Promise<Auth.AuthResponse> {
    const request: Auth.RegisterRequest = {
      name: registerDto.name,
      email: registerDto.email,
      phone: registerDto.phone,
      password: registerDto.password,
    };

    return this.call<Auth.AuthResponse>('register', request);
  }

  async login(loginDto: LoginDto): Promise<Auth.AuthResponse> {
    const request: Auth.LoginRequest = {
      email: loginDto.email,
      password: loginDto.password,
    };

    return this.call<Auth.AuthResponse>('login', request);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<Auth.AuthResponse> {
    const request: Auth.RefreshTokenRequest = {
      refreshToken: dto.refreshToken,
    };

    return this.call<Auth.AuthResponse>('refreshToken', request);
  }

  async logout(dto: RefreshTokenDto): Promise<Auth.LogoutResponse> {
    const request: Auth.LogoutRequest = {
      refreshToken: dto.refreshToken,
    };

    return this.call<Auth.LogoutResponse>('logout', request);
  }

  async validateToken(accessToken: string): Promise<Auth.ValidateTokenResponse> {
    const request: Auth.ValidateTokenRequest = {
      accessToken,
    };

    return this.call<Auth.ValidateTokenResponse>('validateToken', request);
  }

  async checkUserPermissions(
    userId: string,
    permissions: PermissionType[],
  ): Promise<boolean> {
    if (!permissions || permissions.length === 0) {
      return true;
    }

    const normalized = permissions.map((permission) => {
      if (typeof permission === 'string') {
        const [resource, action] = permission
          .split(':')
          .map((part) => part.trim());

        if (!resource || !action) {
          throw new Error(`Invalid permission format: ${permission}`);
        }

        return { resource, action };
      }

      return permission;
    });

    const responses = await Promise.all(
      normalized.map(({ resource, action }) =>
        this.call<Auth.CheckPermissionResponse>('checkPermission', {
          userId,
          resource,
          action,
        }),
      ),
    );

    return responses.every((response) => response.hasPermission);
  }

  private ensureClient(): Auth.AuthServiceClient {
    if (!this.clientRef) {
      throw new Error('AuthService gRPC client is not initialised');
    }

    return this.clientRef;
  }

  private async call<TResponse>(
    method: keyof Auth.AuthServiceClient,
    request: unknown,
  ): Promise<TResponse> {
    const client = this.ensureClient();
    const handler = client[method].bind(client) as GrpcUnaryMethod<
      unknown,
      TResponse
    >;

    return this.safeUnaryCall(() => firstValueFrom(handler(request, this.metadata)));
  }

  private async safeUnaryCall<T>(factory: () => Promise<T>): Promise<T> {
    try {
      return await factory();
    } catch (error) {
      throw this.unwrapGrpcError(error);
    }
  }

  private unwrapGrpcError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'object' && error !== null) {
      const message =
        (error as { details?: string }).details ??
        (error as { message?: string }).message ??
        'Unknown gRPC error';
      return new Error(message);
    }

    return new Error('Unknown gRPC error');
  }
}
