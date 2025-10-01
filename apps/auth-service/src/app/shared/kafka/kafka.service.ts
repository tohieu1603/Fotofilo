import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to topics as needed
    await this.kafkaClient.connect();
  }

  emit<T = unknown>(topic: string, message: T) {
    return this.kafkaClient.emit(topic, message);
  }
}
