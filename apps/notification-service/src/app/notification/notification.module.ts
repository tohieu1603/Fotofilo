import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { MailService } from './mail.service';
import { UserServiceClient } from './clients/user-service.client';
import { AddressServiceClient } from './clients/address-service.client';
import { resolveProtoPath } from '@nestcm/proto';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: resolveProtoPath('proto/user.proto'),
          url: process.env.USER_SERVICE_GRPC_URL || '0.0.0.0:50052',
        },
      },
      {
        name: 'ADDRESS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'address',
          protoPath: resolveProtoPath('proto/address.proto'),
          url: process.env.ADDRESS_SERVICE_GRPC_URL || '0.0.0.0:50052',
        },
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, MailService, UserServiceClient, AddressServiceClient],
  exports: [NotificationService],
})
export class NotificationModule {}