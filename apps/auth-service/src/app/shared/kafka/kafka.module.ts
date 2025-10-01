import { Module, Global } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')],
          },
          consumer: {
            groupId: process.env.KAFKA_GROUP_ID || 'auth-service-group',
          },
        },
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
