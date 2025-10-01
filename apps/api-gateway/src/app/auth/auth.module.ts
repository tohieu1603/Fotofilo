import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { Auth, resolveProtoPath } from '@nestcm/proto';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: Auth.AUTH_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: resolveProtoPath('proto/auth.proto'),
          url: process.env.AUTH_GRPC_URL || 'localhost:50052',
        },
      },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [
    AuthService,
    JwtAuthGuard,
    JwtModule,   
  ],
})
export class AuthModule {}
