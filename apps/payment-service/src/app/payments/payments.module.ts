import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from './domain/entities/payment.entity';
import { PaymentService } from './application/services/payment.service';
import { PaymentController } from './presentation/payment.controller';
import { MoMoProvider } from './infrastructure/providers/momo.provider';
import { KafkaProducer } from './infrastructure/kafka/kafka.producer';
import { KafkaConsumer } from './infrastructure/kafka/kafka.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([Payment]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    MoMoProvider,
    KafkaProducer,
    KafkaConsumer,
  ],
  exports: [PaymentService],
})
export class PaymentsModule {}
