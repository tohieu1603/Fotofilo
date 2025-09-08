import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class KafkaService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('category.created');
    this.kafkaClient.subscribeToResponseOf('category.deleted');
    await this.kafkaClient.connect();
  }

  emit(topic: string, message: any) {
    return this.kafkaClient.emit(topic, message);
  }
}
